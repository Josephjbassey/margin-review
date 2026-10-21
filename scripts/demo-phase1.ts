import { ingestFiles } from "../lib/ingestion";
import { runCompareStep } from "../lib/pipeline";
import { highlightOffsets } from "../lib/highlight";
import { validatePairLimit, MAX_PAIRS } from "../lib/clocked/client";
import { clearCache } from "../lib/clocked/cache";

async function main() {
  console.log("==========================================================");
  console.log("       MARGIN (Phase 1 Working Demo: Pipeline & Compare)  ");
  console.log("==========================================================\n");

  // Clear disk cache for fresh run
  clearCache();

  // 1. Synthetic Submissions (.txt and synthetic docx)
  const essayA = Buffer.from(
    "Student Alice Vance (Matric: CS/2024/019).\n" +
    "Topic: Algorithmic Verification.\n" +
    "In our experiment, the deterministic verification algorithm converged in exactly 45 iterations with 99.2% precision."
  );

  const essayB = Buffer.from(
    "Student Bob Wright (Matric: CS/2024/044).\n" +
    "Topic: Algorithmic Verification.\n" +
    "In our experiment, the deterministic verification algorithm converged in exactly 120 iterations with 64.0% precision."
  );

  const essayC = Buffer.from(
    "Student Clara Oswald (Matric: CS/2024/082).\n" +
    "Topic: Machine Ethics.\n" +
    "Modern language models require human-in-the-loop oversight to ensure academic integrity standards are maintained."
  );

  console.log("[1] Ingesting submissions and reading pack...");
  const parsedDocs = await ingestFiles(
    [
      { name: "essay_alice.txt", buffer: essayA },
      { name: "essay_bob.docx", buffer: essayB },
      { name: "essay_clara.txt", buffer: essayC },
    ],
    []
  );

  for (const doc of parsedDocs) {
    console.log(`  ✓ Ingested ${doc.filename} -> Anonymous Label: [${doc.label}] (${doc.text.length} chars)`);
  }

  // 2. MAX_PAIRS Guard Check
  console.log(`\n[2] Checking MAX_PAIRS guard (Settings limit: ${MAX_PAIRS})...`);
  const guard = validatePairLimit(parsedDocs.length);
  console.log(`  Submissions: ${parsedDocs.length} -> Pairs: ${guard.pairCount} (Limit: ${guard.maxPairs}) -> Allowed: ${guard.allowed}`);

  // 3. Run Pipeline Compare Step
  console.log("\n[3] Executing Compare Step (Throttled pool: 4 workers, Disk Cached)...");
  
  const pipelineDocs = parsedDocs.map((d, i) => ({
    id: `doc-${i + 1}`,
    filename: d.filename,
    kind: d.kind,
    text: d.text,
    masked_text: d.text, // Will be masked by Protect in Phase 2
    label: d.label,
  }));

  const findings = await runCompareStep(
    pipelineDocs,
    (progress) => {
      console.log(`  [Progress] Step: ${progress.step} | Done: ${progress.done}/${progress.total} | State: ${progress.state}`);
    },
    (docA, docB) => {
      // Synthetic fallback simulating Clocked Compare response
      if (
        (docA.label === "S-01" && docB.label === "S-02") ||
        (docA.label === "S-02" && docB.label === "S-01")
      ) {
        return {
          relation: "conflict",
          probability: 0.94,
          passages_a: [
            {
              char_start: 133,
              char_end: 184,
              text: "converged in exactly 45 iterations with 99.2% precision.",
            },
          ],
          passages_b: [
            {
              char_start: 131,
              char_end: 183,
              text: "converged in exactly 120 iterations with 64.0% precision.",
            },
          ],
          raw_response: { status: "success", synthetic: true },
        };
      }
      return {
        relation: "none",
        probability: 0.05,
        passages_a: [],
        passages_b: [],
        raw_response: { status: "success", synthetic: true },
      };
    }
  );

  console.log(`\n[4] Pairwise Findings (Prioritized: Conflicts First):`);
  findings.forEach((f, idx) => {
    console.log(`\n  Pair #${idx + 1}: ${f.doc_a.label} vs ${f.doc_b.label}`);
    console.log(`    Relation:    [${f.relation.toUpperCase()}]`);
    console.log(`    Probability: ${(f.probability * 100).toFixed(1)}%`);

    if (f.passages_a.length > 0 && f.passages_b.length > 0) {
      console.log(`    Passage A (${f.doc_a.label}): "${f.passages_a[0].text}" (chars ${f.passages_a[0].char_start}-${f.passages_a[0].char_end})`);
      console.log(`    Passage B (${f.doc_b.label}): "${f.passages_b[0].text}" (chars ${f.passages_b[0].char_start}-${f.passages_b[0].char_end})`);

      // Safe HTML highlight demonstration
      const highlightedA = highlightOffsets(f.doc_a.text, f.passages_a);
      console.log(`    HTML Safe Highlight Preview:\n      ${highlightedA.slice(100, 240)}...`);
    }
  });

  console.log("\n==========================================================");
  console.log("       PHASE 1 VERIFICATION COMPLETE                      ");
  console.log("==========================================================");
}

main().catch(console.error);
