import { ingestFiles } from "../lib/ingestion";
import { runFullPipeline } from "../lib/pipeline";
import {
  recordDecision,
  computeDecisionsStats,
  generateMarkdownExport,
  getDecisionsForBatch,
} from "../lib/decisions";
import { clearCache } from "../lib/clocked/cache";

async function main() {
  console.log("==========================================================");
  console.log("    MARGIN (Phase 2 Working Demo: Protect, Verify, Rerank)");
  console.log("==========================================================\n");

  clearCache();
  const batchId = "batch-cs102-demo";

  // 1. Synthetic submissions with real PII
  const subA = Buffer.from(
    "Student Alice Vance (Matric: CS/2024/019). Email: alice.vance@uni.ac.uk.\n" +
    "Topic: Algorithmic Verification.\n" +
    "Our empirical evaluation confirms the deterministic verification algorithm converged in exactly 45 iterations with 99.2% precision."
  );

  const subB = Buffer.from(
    "Student Bob Wright (Matric: CS/2024/044). Email: bob.wright@uni.ac.uk.\n" +
    "Topic: Algorithmic Verification.\n" +
    "Our empirical evaluation confirms the deterministic verification algorithm converged in exactly 120 iterations with 64.0% precision."
  );

  const subC = Buffer.from(
    "Student Clara Oswald (Matric: CS/2024/082).\n" +
    "Topic: Quantum Computing in Verification.\n" +
    "We implemented quantum annealing on D-Wave hardware and eliminated all runtime overheads completely."
  );

  // 2. Reading Pack
  const readingPackDoc = Buffer.from(
    "COURSE READING PACK · CS-102 INFORMATICS\n" +
    "Textbook Chapter 4: Convergence Bounds in Deterministic Systems.\n" +
    "Under standard bounded inputs, the verification algorithm converges in exactly 45 iterations. Any run exceeding 60 iterations implies anomalous convergence behavior or diverging heuristics.\n\n" +
    "Textbook Chapter 5: Classical Limits.\n" +
    "Quantum annealing has not been proven to eliminate runtime overheads in classical polynomial verification problems."
  );

  console.log("[1] Ingesting files...");
  const parsedDocs = await ingestFiles(
    [
      { name: "essay_alice.txt", buffer: subA },
      { name: "essay_bob.docx", buffer: subB },
      { name: "essay_clara.txt", buffer: subC },
    ],
    [{ name: "cs102_reading_pack.txt", buffer: readingPackDoc }]
  );

  const submissions = parsedDocs
    .filter((d) => d.kind === "submission")
    .map((d, i) => ({
      id: `doc-sub-${i + 1}`,
      filename: d.filename,
      kind: d.kind,
      text: d.text,
      masked_text: "",
      label: d.label,
    }));

  const readingPack = parsedDocs
    .filter((d) => d.kind === "reading")
    .map((d, i) => ({
      id: `doc-read-${i + 1}`,
      filename: d.filename,
      kind: d.kind,
      text: d.text,
      masked_text: d.text,
      label: d.label,
    }));

  console.log(`  Submissions: ${submissions.length} (${submissions.map((s) => s.label).join(", ")})`);
  console.log(`  Reading Pack: ${readingPack.length} (${readingPack.map((r) => r.label).join(", ")})`);

  console.log("\n[2] Executing Full Multi-Step Pipeline...");

  const pipelineOutput = await runFullPipeline(
    submissions,
    readingPack,
    (p) => {
      console.log(`  ➔ Step [${p.step.toUpperCase()}]: ${p.done}/${p.total} (${p.state})`);
    },
    {
      protect: (doc) => {
        // Realistic Clocked /pii simulation
        if (doc.label === "S-01") {
          return {
            masked_text:
              "Student <PERSON> (Matric: <STUDENT_ID>). Email: <EMAIL>.\nTopic: Algorithmic Verification.\nOur empirical evaluation confirms the deterministic verification algorithm converged in exactly 45 iterations with 99.2% precision.",
            entities: [
              { type: "person", value: "Alice Vance", start: 8, end: 19, confidence: 1 },
              { type: "student_id", value: "CS/2024/019", start: 29, end: 40, confidence: 1 },
              { type: "email", value: "alice.vance@uni.ac.uk", start: 49, end: 71, confidence: 1 },
            ],
            entities_masked_count: 3,
            raw_response: { status: "success" },
          };
        }
        if (doc.label === "S-02") {
          return {
            masked_text:
              "Student <PERSON> (Matric: <STUDENT_ID>). Email: <EMAIL>.\nTopic: Algorithmic Verification.\nOur empirical evaluation confirms the deterministic verification algorithm converged in exactly 120 iterations with 64.0% precision.",
            entities: [
              { type: "person", value: "Bob Wright", start: 8, end: 18, confidence: 1 },
              { type: "student_id", value: "CS/2024/044", start: 28, end: 39, confidence: 1 },
              { type: "email", value: "bob.wright@uni.ac.uk", start: 48, end: 67, confidence: 1 },
            ],
            entities_masked_count: 3,
            raw_response: { status: "success" },
          };
        }
        return {
          masked_text:
            "Student <PERSON> (Matric: <STUDENT_ID>).\nTopic: Quantum Computing in Verification.\nWe implemented quantum annealing on D-Wave hardware and eliminated all runtime overheads completely.",
          entities: [
            { type: "person", value: "Clara Oswald", start: 8, end: 20, confidence: 1 },
            { type: "student_id", value: "CS/2024/082", start: 30, end: 41, confidence: 1 },
          ],
          entities_masked_count: 2,
          raw_response: { status: "success" },
        };
      },
      compare: (docA, docB) => {
        // Clocked /compare response
        if (
          (docA.label === "S-01" && docB.label === "S-02") ||
          (docA.label === "S-02" && docB.label === "S-01")
        ) {
          return {
            relation: "conflict",
            probability: 0.96,
            passages_a: [
              {
                char_start: 180,
                char_end: 228,
                text: "converged in exactly 45 iterations with 99.2% precision.",
              },
            ],
            passages_b: [
              {
                char_start: 178,
                char_end: 227,
                text: "converged in exactly 120 iterations with 64.0% precision.",
              },
            ],
            raw_response: { model: "clocked-1.0", verdict: "conflicts" },
          };
        }
        return {
          relation: "none",
          probability: 0.04,
          passages_a: [],
          passages_b: [],
          raw_response: { model: "clocked-1.0", verdict: "unrelated" },
        };
      },
      verify: (doc) => {
        // Clocked /grounding response
        if (doc.label === "S-01") {
          return {
            grounded_score: 0.98,
            overall_verdict: "supported",
            claims: [
              {
                claim: "The deterministic verification algorithm converged in exactly 45 iterations.",
                status: "supported",
                verdict: "supported",
                confidence: 0.99,
                evidence: [
                  {
                    source_id: "R-01",
                    passage_text: "Under standard bounded inputs, the verification algorithm converges in exactly 45 iterations.",
                    relation: "supported",
                    char_start: 104,
                    char_end: 197,
                    confidence: 0.99,
                  },
                ],
              },
            ],
            unsupported_claim_indexes: [],
            raw_response: {},
          };
        }
        if (doc.label === "S-02") {
          return {
            grounded_score: 0.15,
            overall_verdict: "contradicted",
            claims: [
              {
                claim: "The deterministic verification algorithm converged in exactly 120 iterations.",
                status: "unsupported",
                verdict: "contradicted",
                confidence: 0.05,
                evidence: [
                  {
                    source_id: "R-01",
                    passage_text: "Any run exceeding 60 iterations implies anomalous convergence behavior or diverging heuristics.",
                    relation: "contradicts",
                    char_start: 198,
                    char_end: 294,
                    confidence: 0.95,
                  },
                ],
              },
            ],
            unsupported_claim_indexes: [0],
            raw_response: {},
          };
        }
        return {
          grounded_score: 0.05,
          overall_verdict: "contradicted",
          claims: [
            {
              claim: "We implemented quantum annealing on D-Wave hardware and eliminated all runtime overheads completely.",
              status: "unsupported",
              verdict: "contradicted",
              confidence: 0.02,
              evidence: [
                {
                  source_id: "R-01",
                  passage_text: "Quantum annealing has not been proven to eliminate runtime overheads in classical polynomial verification problems.",
                  relation: "contradicts",
                  char_start: 334,
                  char_end: 450,
                  confidence: 0.97,
                },
              ],
            },
          ],
          unsupported_claim_indexes: [0],
          raw_response: {},
        };
      },
      rerank: (claim) => {
        // Clocked /rerank response
        return {
          query: claim.text,
          results: [
            {
              index: 0,
              id: "R-01-p1",
              action: "use",
              relevance_score: 0.985,
              document_score: 0.991,
            },
            {
              index: 1,
              id: "R-01-p2",
              action: "expand",
              relevance_score: 0.45,
            },
          ],
          raw_response: {},
        };
      },
    }
  );

  console.log("\n[3] Pipeline Results Summary:");
  console.log(`  Total Student Identifiers Masked: ${pipelineOutput.totalIdentifiersMasked}`);
  console.log(`  Pairwise Findings: ${pipelineOutput.pairFindings.length}`);
  console.log(`  Claims Checked:    ${pipelineOutput.claimFindings.length}`);

  console.log("\n[4] Sample Protected Text (S-01):");
  console.log(`  "${pipelineOutput.maskedSubmissions[0].masked_text.slice(0, 100)}..."`);

  console.log("\n[5] Verified Claims (Unsupported Prioritized First):");
  pipelineOutput.claimFindings.forEach((c, idx) => {
    console.log(`  #${idx + 1} [${c.status.toUpperCase()}] (${c.document.label})`);
    console.log(`     Claim:    "${c.text}"`);
    if (c.evidence.length > 0) {
      console.log(`     Evidence: [${c.evidence[0].source_id}] "${c.evidence[0].passage_text}"`);
    }
    if (c.reranked_evidence && c.reranked_evidence.length > 0) {
      console.log(`     Reranked Top Passage: (Score: ${(c.reranked_evidence[0].relevance_score * 100).toFixed(1)}%) "${c.reranked_evidence[0].passage_text.slice(0, 70)}..."`);
    }
  });

  // 6. Record Lecturer Decisions
  console.log("\n[6] Recording Lecturer Review Decisions...");
  // Finding 1: Pair conflict S-01 vs S-02 -> Flag for follow-up
  recordDecision(batchId, "pair", pipelineOutput.pairFindings[0].id, "flag", "Contradictory empirical numbers between S-01 and S-02. Needs interview.");
  // Finding 2: Claim 1 (S-02 120 iterations) -> Flag
  recordDecision(batchId, "claim", pipelineOutput.claimFindings[0].id, "flag", "Student claims 120 iterations; textbook limits to 45.");
  // Finding 3: Claim 2 (S-03 quantum) -> Ask to cite
  recordDecision(batchId, "claim", pipelineOutput.claimFindings[1].id, "cite", "Ask student to provide laboratory log citation for D-Wave run.");
  // Finding 4: Claim 3 (S-01 45 iterations) -> Accept
  recordDecision(batchId, "claim", pipelineOutput.claimFindings[2].id, "accept", "Matches Chapter 4 specification.");

  const allDecisions = getDecisionsForBatch(batchId);
  const totalFindings = pipelineOutput.pairFindings.length + pipelineOutput.claimFindings.length;
  const stats = computeDecisionsStats(totalFindings, allDecisions);

  console.log("\n[7] Decision Stats Calculated:");
  console.log(`  Total: ${stats.total} | Flagged: ${stats.flagged} | Dismissed/Accepted: ${stats.dismissed} | Pending: ${stats.pending} | Complete: ${stats.decided_percentage}%`);

  const mdSummary = generateMarkdownExport(
    "CS-102 Informatics Batch 1",
    stats,
    [
      {
        type: "pair",
        label: `${pipelineOutput.pairFindings[0].doc_a.label} vs ${pipelineOutput.pairFindings[0].doc_b.label}`,
        choice: "FLAG",
        note: "Contradictory empirical numbers between S-01 and S-02. Needs interview.",
        detail: "S-01 claims 45 iterations; S-02 claims 120 iterations.",
      },
      {
        type: "claim",
        label: `${pipelineOutput.claimFindings[0].document.label} Claim`,
        choice: "FLAG",
        note: "Student claims 120 iterations; textbook limits to 45.",
        detail: pipelineOutput.claimFindings[0].text,
      },
    ]
  );

  console.log("\n[8] Generated Markdown Review Summary Preview:");
  console.log(mdSummary.slice(0, 520) + "\n...\n");

  console.log("==========================================================");
  console.log("       PHASE 2 VERIFICATION COMPLETE                      ");
  console.log("==========================================================");
}

main().catch(console.error);
