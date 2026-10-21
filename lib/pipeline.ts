import { compare, validatePairLimit } from "./clocked/client";
import { CompareResult, PassageOffset } from "./clocked/adapters";

export interface PipelineDocument {
  id: string;
  filename: string;
  kind: "submission" | "reading";
  text: string;
  masked_text: string;
  label: string;
}

export interface PipelinePairFinding {
  doc_a: PipelineDocument;
  doc_b: PipelineDocument;
  relation: CompareResult["relation"];
  probability: number;
  passages_a: PassageOffset[];
  passages_b: PassageOffset[];
  raw_json: any;
}

export interface PipelineStepProgress {
  step: "ingest" | "protect" | "compare" | "verify" | "rerank";
  done: number;
  total: number;
  state: "pending" | "running" | "done" | "error";
  error_message?: string;
}

export type ProgressCallback = (progress: PipelineStepProgress) => Promise<void> | void;

/**
 * Generates all unique pairs of items: n * (n - 1) / 2
 */
export function generatePairs<T>(items: T[]): Array<[T, T]> {
  const pairs: Array<[T, T]> = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      pairs.push([items[i], items[j]]);
    }
  }
  return pairs;
}

/**
 * Step 3 of Margin Pipeline: Compare all pairs of submissions.
 *
 * Rules:
 * - n(n-1)/2 pairs.
 * - MAX_PAIRS guard: throws error if pair count exceeds MAX_PAIRS.
 * - Concurrency capped at 4 (handled in Clocked client).
 * - Disk cached by content hash (handled in Clocked client).
 * - Idempotent, resumable, reports step progress.
 * - Never swallows errors silently.
 */
export async function runCompareStep(
  submissions: PipelineDocument[],
  onProgress?: ProgressCallback,
  mockFallbackGenerator?: (docA: PipelineDocument, docB: PipelineDocument) => CompareResult
): Promise<PipelinePairFinding[]> {
  const n = submissions.length;
  const guard = validatePairLimit(n);

  if (!guard.allowed) {
    const errorMsg = `Batch exceeds limit: ${guard.pairCount} pairs requested, but MAX_PAIRS is set to ${guard.maxPairs}.`;
    if (onProgress) {
      await onProgress({
        step: "compare",
        done: 0,
        total: guard.pairCount,
        state: "error",
        error_message: errorMsg,
      });
    }
    throw new Error(errorMsg);
  }

  const pairs = generatePairs(submissions);
  const total = pairs.length;

  if (onProgress) {
    await onProgress({
      step: "compare",
      done: 0,
      total,
      state: "running",
    });
  }

  const findings: PipelinePairFinding[] = [];
  let doneCount = 0;

  // Execute comparisons (client throttles concurrency to 4 and checks disk cache)
  const tasks = pairs.map(async ([docA, docB]) => {
    try {
      // Use masked_text for comparison if available, falling back to text
      const textA = docA.masked_text || docA.text;
      const textB = docB.masked_text || docB.text;

      const result = await compare(
        { id: docA.label, text: textA },
        { id: docB.label, text: textB },
        mockFallbackGenerator ? () => mockFallbackGenerator(docA, docB) : undefined
      );

      const finding: PipelinePairFinding = {
        doc_a: docA,
        doc_b: docB,
        relation: result.relation,
        probability: result.probability,
        passages_a: result.passages_a,
        passages_b: result.passages_b,
        raw_json: result.raw_response,
      };

      findings.push(finding);
      doneCount++;

      if (onProgress) {
        await onProgress({
          step: "compare",
          done: doneCount,
          total,
          state: doneCount === total ? "done" : "running",
        });
      }

      return finding;
    } catch (err: any) {
      console.error(`[Pipeline Compare Error] Pair ${docA.label} <-> ${docB.label}:`, err);
      doneCount++;
      if (onProgress) {
        await onProgress({
          step: "compare",
          done: doneCount,
          total,
          state: "error",
          error_message: `Error comparing ${docA.label} and ${docB.label}: ${err?.message}`,
        });
      }
      throw err;
    }
  });

  await Promise.all(tasks);

  // Sort findings: conflicts first, then duplicates, same facts, overlap, none
  const priorityOrder: Record<string, number> = {
    conflict: 1,
    duplicate: 2,
    same_facts: 3,
    overlap: 4,
    none: 5,
  };

  findings.sort((a, b) => {
    const prioA = priorityOrder[a.relation] ?? 99;
    const prioB = priorityOrder[b.relation] ?? 99;
    if (prioA !== prioB) return prioA - prioB;
    return b.probability - a.probability;
  });

  return findings;
}
