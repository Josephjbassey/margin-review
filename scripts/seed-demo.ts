import fs from "fs";
import path from "path";
import { ingestFiles } from "../lib/ingestion";
import { runFullPipeline } from "../lib/pipeline";
import { saveBatch, StoredBatch } from "../lib/storage";
import { recordDecision } from "../lib/decisions";

async function seedDemo() {
  console.log("Seeding synthetic demo batch into Margin...");

  const sampleDir = path.join(process.cwd(), "sample_data");

  // Load submissions
  const submissionFiles = [
    "essay_01_alice.txt",
    "essay_02_bob.txt",
    "essay_03_clara.txt",
    "essay_04_david.txt",
    "essay_05_elena.txt",
    "essay_06_fiona.txt",
  ];

  const readingFiles = [
    "reading_pack_ch4_convergence.txt",
    "reading_pack_ch7_complexity.txt",
  ];

  const subBuffers = submissionFiles.map((name) => ({
    name,
    buffer: fs.readFileSync(path.join(sampleDir, name)),
  }));

  const readBuffers = readingFiles.map((name) => ({
    name,
    buffer: fs.readFileSync(path.join(sampleDir, name)),
  }));

  const parsed = await ingestFiles(subBuffers, readBuffers);

  const submissions = parsed
    .filter((d) => d.kind === "submission")
    .map((d, i) => ({
      id: `doc-sub-${i + 1}`,
      filename: d.filename,
      kind: d.kind,
      text: d.text,
      masked_text: "",
      label: d.label,
    }));

  const readingPack = parsed
    .filter((d) => d.kind === "reading")
    .map((d, i) => ({
      id: `doc-read-${i + 1}`,
      filename: d.filename,
      kind: d.kind,
      text: d.text,
      masked_text: d.text,
      label: d.label,
    }));

  const batchId = "batch-demo-gns102";

  console.log(`Ingested ${submissions.length} submissions and ${readingPack.length} reading pack documents.`);

  const pipelineOutput = await runFullPipeline(
    submissions,
    readingPack,
    undefined,
    {
      protect: (doc) => {
        // Mask names and matric numbers
        const masked = doc.text
          .replace(/Student Name: [^\n]+/g, "Student Name: <PERSON>")
          .replace(/Student ID: [^\n]+/g, "Student ID: <STUDENT_ID>")
          .replace(/Email: [^\n]+/g, "Email: <EMAIL>");
        return {
          masked_text: masked,
          entities: [
            { type: "person", value: "Student Name", start: 0, end: 20, confidence: 1 },
            { type: "student_id", value: "Student ID", start: 25, end: 40, confidence: 1 },
            { type: "email", value: "Email", start: 45, end: 65, confidence: 1 },
          ],
          entities_masked_count: 3,
          raw_response: { status: "success" },
        };
      },
      compare: (docA, docB) => {
        // S-01 vs S-02: Contradiction on convergence count (45 vs 120)
        if (
          (docA.label === "S-01" && docB.label === "S-02") ||
          (docA.label === "S-02" && docB.label === "S-01")
        ) {
          return {
            relation: "conflict",
            probability: 0.98,
            passages_a: [
              {
                char_start: 367,
                char_end: 423,
                text: "converged in exactly 45 iterations with 99.2% precision.",
              },
            ],
            passages_b: [
              {
                char_start: 365,
                char_end: 422,
                text: "converged in exactly 120 iterations with 64.0% precision.",
              },
            ],
            raw_response: { verdict: "conflicts" },
          };
        }

        // S-05 vs S-06: Near-duplicate pair on LTL model checking
        if (
          (docA.label === "S-05" && docB.label === "S-06") ||
          (docA.label === "S-06" && docB.label === "S-05")
        ) {
          return {
            relation: "duplicate",
            probability: 0.92,
            passages_a: [
              {
                char_start: 172,
                char_end: 400,
                text: "Linear Temporal Logic (LTL) provides a rigorous mathematical framework for specifying qualitative temporal behaviors in reactive computing systems. We convert LTL formulas into generalized Büchi automata using standard tableau decomposition.",
              },
            ],
            passages_b: [
              {
                char_start: 180,
                char_end: 410,
                text: "Linear Temporal Logic (LTL) offers a rigorous mathematical framework for specifying qualitative temporal properties in reactive computer systems. In our experiment, LTL specifications are translated into generalized Büchi automata via standard tableau decomposition.",
              },
            ],
            raw_response: { verdict: "duplicates" },
          };
        }

        // S-03 vs S-04: Shared facts on partial order reduction
        if (
          (docA.label === "S-03" && docB.label === "S-04") ||
          (docA.label === "S-04" && docB.label === "S-03")
        ) {
          return {
            relation: "same_facts",
            probability: 0.85,
            passages_a: [
              {
                char_start: 420,
                char_end: 540,
                text: "reduced visited states by an average factor of 3.4x without losing soundness.",
              },
            ],
            passages_b: [
              {
                char_start: 410,
                char_end: 530,
                text: "reduced visited states by an average factor of 3.4x without losing soundness across all checked safety assertions.",
              },
            ],
            raw_response: { verdict: "same_facts" },
          };
        }

        return {
          relation: "none",
          probability: 0.05,
          passages_a: [],
          passages_b: [],
          raw_response: { verdict: "unrelated" },
        };
      },
      verify: (doc) => {
        if (doc.label === "S-01") {
          return {
            grounded_score: 0.99,
            overall_verdict: "supported",
            claims: [
              {
                claim: "The deterministic verification algorithm converged in exactly 45 iterations with 99.2% precision.",
                status: "supported",
                verdict: "supported",
                confidence: 0.99,
                evidence: [
                  {
                    source_id: "R-01",
                    passage_text: "Under standard bounded inputs and the canonical Alpha benchmark suite, the deterministic verification algorithm converges in exactly 45 iterations.",
                    relation: "supported",
                    char_start: 334,
                    char_end: 485,
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
            grounded_score: 0.12,
            overall_verdict: "contradicted",
            claims: [
              {
                claim: "The deterministic verification algorithm converged in exactly 120 iterations with 64.0% precision.",
                status: "unsupported",
                verdict: "contradicted",
                confidence: 0.05,
                evidence: [
                  {
                    source_id: "R-01",
                    passage_text: "Any empirical run exceeding 60 iterations implies anomalous convergence behavior or diverging heuristics.",
                    relation: "contradicts",
                    char_start: 486,
                    char_end: 593,
                    confidence: 0.96,
                  },
                ],
              },
            ],
            unsupported_claim_indexes: [0],
            raw_response: {},
          };
        }

        if (doc.label === "S-03" || doc.label === "S-04") {
          return {
            grounded_score: 0.94,
            overall_verdict: "supported",
            claims: [
              {
                claim: "Ample set construction reduces visited states by an average factor of 3.4x without losing soundness.",
                status: "supported",
                verdict: "supported",
                confidence: 0.95,
                evidence: [
                  {
                    source_id: "R-02",
                    passage_text: "For stuttering-free properties, ample set construction reduces visited states by an average factor of 3.4x without losing soundness.",
                    relation: "supported",
                    char_start: 470,
                    char_end: 605,
                    confidence: 0.98,
                  },
                ],
              },
            ],
            unsupported_claim_indexes: [],
            raw_response: {},
          };
        }

        return {
          grounded_score: 0.8,
          overall_verdict: "supported",
          claims: [
            {
              claim: "LTL formulas convert into generalized Büchi automata using standard tableau decomposition.",
              status: "supported",
              verdict: "supported",
              confidence: 0.9,
              evidence: [
                {
                  source_id: "R-02",
                  passage_text: "Ample set construction mitigates this explosion.",
                  relation: "supported",
                  char_start: 300,
                  char_end: 350,
                  confidence: 0.85,
                },
              ],
            },
          ],
          unsupported_claim_indexes: [],
          raw_response: {},
        };
      },
      rerank: (claim) => {
        return {
          query: claim.text,
          results: [
            {
              index: 0,
              id: "R-01-p1",
              action: "use",
              relevance_score: 0.97,
              document_score: 0.98,
            },
            {
              index: 1,
              id: "R-01-p2",
              action: "expand",
              relevance_score: 0.42,
            },
          ],
          raw_response: {},
        };
      },
    }
  );

  const demoBatch: StoredBatch = {
    id: batchId,
    name: "GNS102 Informatics & Formal Methods (Autumn 2026)",
    created_at: new Date().toISOString(),
    status: "done",
    current_step: "completed",
    submissions: pipelineOutput.maskedSubmissions,
    reading_pack: readingPack,
    pair_findings: pipelineOutput.pairFindings,
    claim_findings: pipelineOutput.claimFindings,
    decisions: [],
    progress: {
      ingest: { step: "ingest", done: 8, total: 8, state: "done" },
      protect: { step: "protect", done: 6, total: 6, state: "done" },
      compare: { step: "compare", done: 15, total: 15, state: "done" },
      verify: { step: "verify", done: 6, total: 6, state: "done" },
      rerank: { step: "rerank", done: 1, total: 1, state: "done" },
    },
    total_identifiers_masked: pipelineOutput.totalIdentifiersMasked,
  };

  // Pre-seed sample lecturer decisions for the demo
  if (pipelineOutput.pairFindings.length > 0) {
    const dec1 = recordDecision(
      batchId,
      "pair",
      pipelineOutput.pairFindings[0].id,
      "flag",
      "Contradictory empirical numbers (45 vs 120 iterations). Schedule academic follow-up interview."
    );
    demoBatch.decisions.push(dec1);
  }

  if (pipelineOutput.pairFindings.length > 1) {
    const dec2 = recordDecision(
      batchId,
      "pair",
      pipelineOutput.pairFindings[1].id,
      "flag",
      "Extensive text overlap on LTL model checking. Check if students collaborated."
    );
    demoBatch.decisions.push(dec2);
  }

  if (pipelineOutput.claimFindings.length > 0) {
    const dec3 = recordDecision(
      batchId,
      "claim",
      pipelineOutput.claimFindings[0].id,
      "flag",
      "Claim contradicts Textbook Section 4.1."
    );
    demoBatch.decisions.push(dec3);
  }

  saveBatch(demoBatch);

  console.log(`✓ Seeded demo batch "${demoBatch.name}" [${batchId}] successfully!`);
  console.log(`  - Submissions: ${demoBatch.submissions.length}`);
  console.log(`  - Identifiers Masked: ${demoBatch.total_identifiers_masked}`);
  console.log(`  - Pair Findings: ${demoBatch.pair_findings.length}`);
  console.log(`  - Claims Checked: ${demoBatch.claim_findings.length}`);
  console.log(`  - Decisions Recorded: ${demoBatch.decisions.length}`);
}

seedDemo().catch(console.error);
