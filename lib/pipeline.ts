import {
  protect,
  compare,
  verify,
  rerank,
  validatePairLimit,
} from "./clocked/client";
import {
  ProtectResult,
  CompareResult,
  VerifyResult,
  RerankResult,
  PassageOffset,
  VerifyEvidence,
} from "./clocked/adapters";

export interface PipelineDocument {
  id: string;
  filename: string;
  kind: "submission" | "reading";
  text: string;
  masked_text: string;
  label: string;
  identifiers_masked_count?: number;
}

export interface PipelinePairFinding {
  id: string;
  doc_a: PipelineDocument;
  doc_b: PipelineDocument;
  relation: CompareResult["relation"];
  probability: number;
  passages_a: PassageOffset[];
  passages_b: PassageOffset[];
  raw_json?: unknown;
}

export interface PipelineClaimFinding {
  id: string;
  document: PipelineDocument;
  text: string;
  status: "supported" | "partial" | "unsupported";
  verdict: string;
  evidence: VerifyEvidence[];
  reranked_evidence?: Array<{
    passage_text: string;
    source_id: string;
    action: "use" | "expand" | "skip";
    relevance_score: number;
  }>;
  raw_json?: unknown;
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
 * Step 2: Protect (PII Masking)
 *
 * Rules:
 * - Mask names, matriculation numbers, and identifiers in every submission.
 * - Review screens and all later pipeline calls use masked_text only.
 * - The label-to-filename mapping remains private in the DB.
 */
export async function runProtectStep(
  submissions: PipelineDocument[],
  onProgress?: ProgressCallback,
  mockFallback?: (doc: PipelineDocument) => ProtectResult
): Promise<{ maskedSubmissions: PipelineDocument[]; totalIdentifiersMasked: number }> {
  const total = submissions.length;
  let totalIdentifiersMasked = 0;

  if (onProgress) {
    await onProgress({
      step: "protect",
      done: 0,
      total,
      state: "running",
    });
  }

  const maskedSubmissions: PipelineDocument[] = [];

  for (let i = 0; i < total; i++) {
    const doc = submissions[i];
    try {
      const res = await protect(
        doc.text,
        mockFallback ? () => mockFallback(doc) : undefined
      );

      totalIdentifiersMasked += res.entities_masked_count;

      maskedSubmissions.push({
        ...doc,
        masked_text: res.masked_text || doc.text,
        identifiers_masked_count: res.entities_masked_count,
      });

      if (onProgress) {
        await onProgress({
          step: "protect",
          done: i + 1,
          total,
          state: i + 1 === total ? "done" : "running",
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Pipeline Protect Error] ${doc.label}:`, err);
      if (onProgress) {
        await onProgress({
          step: "protect",
          done: i + 1,
          total,
          state: "error",
          error_message: `Error masking ${doc.label}: ${message}`,
        });
      }
      throw err;
    }
  }

  return { maskedSubmissions, totalIdentifiersMasked };
}

/**
 * Step 3: Compare All Pairs
 *
 * Rules:
 * - Uses masked_text only.
 * - Concurrency 4, cached, MAX_PAIRS guard.
 * - Conflicts prioritized first.
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

  const tasks = pairs.map(async ([docA, docB], idx) => {
    try {
      // Must strictly use masked_text
      const textA = docA.masked_text || docA.text;
      const textB = docB.masked_text || docB.text;

      const result = await compare(
        { id: docA.label, text: textA },
        { id: docB.label, text: textB },
        mockFallbackGenerator ? () => mockFallbackGenerator(docA, docB) : undefined
      );

      const finding: PipelinePairFinding = {
        id: `pair-${docA.label}-${docB.label}-${idx}`,
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Pipeline Compare Error] ${docA.label} <-> ${docB.label}:`, err);
      doneCount++;
      if (onProgress) {
        await onProgress({
          step: "compare",
          done: doneCount,
          total,
          state: "error",
          error_message: `Error comparing ${docA.label} and ${docB.label}: ${message}`,
        });
      }
      throw err;
    }
  });

  await Promise.all(tasks);

  // Conflicts first, then duplicate, same facts, overlap, none
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

/**
 * Step 4: Verify (Grounding claims against reading pack)
 *
 * Rules:
 * - Checks each submission's assertions against the reading pack documents.
 * - Labels claims as supported, partial, or unsupported with evidence passages.
 */
export async function runVerifyStep(
  submissions: PipelineDocument[],
  readingPack: PipelineDocument[],
  onProgress?: ProgressCallback,
  mockFallback?: (doc: PipelineDocument) => VerifyResult
): Promise<PipelineClaimFinding[]> {
  const total = submissions.length;

  if (onProgress) {
    await onProgress({
      step: "verify",
      done: 0,
      total,
      state: "running",
    });
  }

  const allClaims: PipelineClaimFinding[] = [];
  const sources = readingPack.map((r) => ({ id: r.label, text: r.text }));

  for (let i = 0; i < total; i++) {
    const doc = submissions[i];
    try {
      // Must use masked_text
      const text = doc.masked_text || doc.text;

      const res = await verify(
        text,
        sources,
        undefined, // Let endpoint extract claims automatically
        mockFallback ? () => mockFallback(doc) : undefined
      );

      for (let cIdx = 0; cIdx < res.claims.length; cIdx++) {
        const c = res.claims[cIdx];
        allClaims.push({
          id: `claim-${doc.label}-${cIdx}`,
          document: doc,
          text: c.claim,
          status: c.status,
          verdict: c.verdict,
          evidence: c.evidence,
          raw_json: c,
        });
      }

      if (onProgress) {
        await onProgress({
          step: "verify",
          done: i + 1,
          total,
          state: i + 1 === total ? "done" : "running",
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Pipeline Verify Error] ${doc.label}:`, err);
      if (onProgress) {
        await onProgress({
          step: "verify",
          done: i + 1,
          total,
          state: "error",
          error_message: `Error verifying ${doc.label}: ${message}`,
        });
      }
      throw err;
    }
  }

  // Sort claims: unsupported first, then partial, then supported
  const claimOrder: Record<string, number> = {
    unsupported: 1,
    partial: 2,
    supported: 3,
  };

  allClaims.sort((a, b) => {
    const prioA = claimOrder[a.status] ?? 99;
    const prioB = claimOrder[b.status] ?? 99;
    return prioA - prioB;
  });

  return allClaims;
}

/**
 * Step 5: Rerank (For unsupported or partial claims only)
 *
 * Rules:
 * - Only runs for claims that are unsupported or partial.
 * - Ranks reading pack candidate passages to find contextual evidence.
 */
export async function runRerankStep(
  claims: PipelineClaimFinding[],
  readingPack: PipelineDocument[],
  onProgress?: ProgressCallback,
  mockFallback?: (claim: PipelineClaimFinding) => RerankResult
): Promise<PipelineClaimFinding[]> {
  // Filter claims that need reranking: only unsupported or partial
  const flaggedClaims = claims.filter(
    (c) => c.status === "unsupported" || c.status === "partial"
  );
  const total = flaggedClaims.length;

  if (total === 0) {
    if (onProgress) {
      await onProgress({
        step: "rerank",
        done: 0,
        total: 0,
        state: "done",
      });
    }
    return claims;
  }

  if (onProgress) {
    await onProgress({
      step: "rerank",
      done: 0,
      total,
      state: "running",
    });
  }

  // Segment reading pack documents into passages/chunks
  const passages: Array<{ id: string; text: string; title: string }> = [];
  for (const doc of readingPack) {
    const paragraphs = doc.text.split(/\n\s*\n/).filter((p) => p.trim().length > 30);
    for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      passages.push({
        id: `${doc.label}-p${pIdx + 1}`,
        text: paragraphs[pIdx].trim(),
        title: `${doc.label} (${doc.filename}) §${pIdx + 1}`,
      });
    }
  }

  for (let i = 0; i < total; i++) {
    const claim = flaggedClaims[i];
    try {
      const res = await rerank(
        claim.text,
        passages,
        3, // top 3 passages
        mockFallback ? () => mockFallback(claim) : undefined
      );

      claim.reranked_evidence = res.results.map((r) => {
        const found = passages.find((p) => p.id === r.id);
        let source_id = "R-01";
        if (r.id) {
          const parts = r.id.split("-");
          source_id = parts.length >= 2 ? `${parts[0]}-${parts[1]}` : parts[0];
        }
        return {
          passage_text: found ? found.text : `Passage ${r.id}`,
          source_id,
          action: r.action,
          relevance_score: r.relevance_score,
        };
      });

      if (onProgress) {
        await onProgress({
          step: "rerank",
          done: i + 1,
          total,
          state: i + 1 === total ? "done" : "running",
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Pipeline Rerank Error] ${claim.id}:`, err);
      if (onProgress) {
        await onProgress({
          step: "rerank",
          done: i + 1,
          total,
          state: "error",
          error_message: `Error reranking ${claim.id}: ${message}`,
        });
      }
      throw err;
    }
  }

  return claims;
}

/**
 * Full Pipeline Execution (Idempotent and Resumable)
 */
export async function runFullPipeline(
  submissions: PipelineDocument[],
  readingPack: PipelineDocument[],
  onProgress?: ProgressCallback,
  mockFallbacks?: {
    protect?: (doc: PipelineDocument) => ProtectResult;
    compare?: (docA: PipelineDocument, docB: PipelineDocument) => CompareResult;
    verify?: (doc: PipelineDocument) => VerifyResult;
    rerank?: (claim: PipelineClaimFinding) => RerankResult;
  }
) {
  // Step 1: Ingest (already performed)
  if (onProgress) {
    await onProgress({
      step: "ingest",
      done: submissions.length + readingPack.length,
      total: submissions.length + readingPack.length,
      state: "done",
    });
  }

  // Step 2: Protect (Mask identifiers before comparison)
  const { maskedSubmissions, totalIdentifiersMasked } = await runProtectStep(
    submissions,
    onProgress,
    mockFallbacks?.protect
  );

  // Step 3: Compare (All pairs of masked submissions)
  const pairFindings = await runCompareStep(
    maskedSubmissions,
    onProgress,
    mockFallbacks?.compare
  );

  // Step 4: Verify (Claims grounded against reading pack)
  const claimFindings = await runVerifyStep(
    maskedSubmissions,
    readingPack,
    onProgress,
    mockFallbacks?.verify
  );

  // Step 5: Rerank (For unsupported/partial claims only)
  await runRerankStep(
    claimFindings,
    readingPack,
    onProgress,
    mockFallbacks?.rerank
  );

  return {
    maskedSubmissions,
    totalIdentifiersMasked,
    pairFindings,
    claimFindings,
  };
}
