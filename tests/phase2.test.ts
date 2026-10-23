import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  runProtectStep,
  runVerifyStep,
  runRerankStep,
  PipelineDocument,
} from "../lib/pipeline";
import {
  recordDecision,
  getDecision,
  computeDecisionsStats,
  generateMarkdownExport,
} from "../lib/decisions";

describe("Phase 2 - Protect, Verify, Rerank & Decisions", () => {
  const sampleSubmissions: PipelineDocument[] = [
    {
      id: "doc-1",
      filename: "submission_john.txt",
      kind: "submission",
      text: "Student John Doe (Matric CS/2024/001). The algorithm converges in 45 iterations.",
      masked_text: "",
      label: "S-01",
    },
    {
      id: "doc-2",
      filename: "submission_jane.txt",
      kind: "submission",
      text: "Student Jane Smith (Matric CS/2024/002). The algorithm converges in 120 iterations.",
      masked_text: "",
      label: "S-02",
    },
  ];

  const sampleReadingPack: PipelineDocument[] = [
    {
      id: "read-1",
      filename: "course_handbook.txt",
      kind: "reading",
      text: "Theorem 1: Convergence Bounds.\nThe deterministic verification algorithm converges in exactly 45 iterations under standard conditions.",
      masked_text: "Theorem 1: Convergence Bounds.\nThe deterministic verification algorithm converges in exactly 45 iterations under standard conditions.",
      label: "R-01",
    },
  ];

  it("runProtectStep masks identifiers and populates masked_text", async () => {
    const { maskedSubmissions, totalIdentifiersMasked } = await runProtectStep(
      sampleSubmissions,
      undefined,
      (doc) => ({
        masked_text: `Student <PERSON> (Matric <STUDENT_ID>). ${doc.text.split(".")[1]}`,
        entities: [
          { type: "person", value: "Name", start: 8, end: 16, confidence: 1 },
          { type: "student_id", value: "ID", start: 25, end: 36, confidence: 1 },
        ],
        entities_masked_count: 2,
        raw_response: { test: true },
      })
    );

    assert.strictEqual(maskedSubmissions.length, 2);
    assert.strictEqual(totalIdentifiersMasked, 4);
    assert.strictEqual(
      maskedSubmissions[0].masked_text.includes("<PERSON>"),
      true
    );
    assert.strictEqual(
      maskedSubmissions[0].masked_text.includes("John Doe"),
      false
    );
  });

  it("runVerifyStep checks claims against reading pack and prioritizes unsupported first", async () => {
    const claims = await runVerifyStep(
      sampleSubmissions,
      sampleReadingPack,
      undefined,
      (doc) => {
        if (doc.label === "S-01") {
          return {
            grounded_score: 0.95,
            overall_verdict: "supported",
            claims: [
              {
                claim: "The algorithm converges in 45 iterations.",
                status: "supported",
                verdict: "supported",
                evidence: [
                  {
                    source_id: "R-01",
                    passage_text: "converges in exactly 45 iterations",
                    relation: "supported",
                    char_start: 31,
                    char_end: 90,
                    confidence: 0.99,
                  },
                ],
                confidence: 0.99,
              },
            ],
            unsupported_claim_indexes: [],
            raw_response: {},
          };
        }
        return {
          grounded_score: 0.1,
          overall_verdict: "unsupported",
          claims: [
            {
              claim: "The algorithm converges in 120 iterations.",
              status: "unsupported",
              verdict: "contradicted",
              evidence: [],
              confidence: 0.05,
            },
          ],
          unsupported_claim_indexes: [0],
          raw_response: {},
        };
      }
    );

    assert.strictEqual(claims.length, 2);
    // Unsupported prioritized first!
    assert.strictEqual(claims[0].status, "unsupported");
    assert.strictEqual(claims[0].document.label, "S-02");
    assert.strictEqual(claims[1].status, "supported");
    assert.strictEqual(claims[1].document.label, "S-01");
  });

  it("runRerankStep only reranks unsupported or partial claims", async () => {
    const claimsList = [
      {
        id: "c-1",
        document: sampleSubmissions[0],
        text: "Supported claim",
        status: "supported" as const,
        verdict: "supported",
        evidence: [],
        raw_json: {},
      },
      {
        id: "c-2",
        document: sampleSubmissions[1],
        text: "Unsupported claim needing rerank",
        status: "unsupported" as const,
        verdict: "not_stated",
        evidence: [],
        raw_json: {},
      },
    ];

    let rerankCalls = 0;
    const reranked = await runRerankStep(
      claimsList,
      sampleReadingPack,
      undefined,
      () => {
        rerankCalls++;
        return {
          query: "Unsupported claim needing rerank",
          results: [
            {
              index: 0,
              id: "R-01-p1",
              action: "use",
              relevance_score: 0.85,
            },
          ],
          raw_response: {},
        };
      }
    );

    // Only the 1 unsupported claim should trigger rerank
    assert.strictEqual(rerankCalls, 1);
    assert.strictEqual(reranked[0].reranked_evidence, undefined);
    assert.strictEqual(reranked[1].reranked_evidence?.length, 1);
    assert.strictEqual(reranked[1].reranked_evidence[0].source_id, "R-01");
  });

  it("recordDecision, computeDecisionsStats, and generateMarkdownExport function cleanly", () => {
    const batchId = "batch-test-1";

    recordDecision(batchId, "pair", "pair-1", "flag", "Suspicious verbatim match");
    recordDecision(batchId, "claim", "claim-1", "dismiss", "Known standard fact");
    recordDecision(batchId, "pair", "pair-2", "common_source", "Quoted textbook formula");

    const dec = getDecision(batchId, "pair", "pair-1");
    assert.strictEqual(dec?.choice, "flag");
    assert.strictEqual(dec?.note, "Suspicious verbatim match");

    const stats = computeDecisionsStats(4, [
      { id: "1", batch_id: batchId, finding_type: "pair", finding_id: "p1", choice: "flag", decided_at: "" },
      { id: "2", batch_id: batchId, finding_type: "claim", finding_id: "c1", choice: "dismiss", decided_at: "" },
      { id: "3", batch_id: batchId, finding_type: "pair", finding_id: "p2", choice: "common_source", decided_at: "" },
    ]);

    assert.strictEqual(stats.total, 4);
    assert.strictEqual(stats.flagged, 1);
    assert.strictEqual(stats.dismissed, 1);
    assert.strictEqual(stats.common_source, 1);
    assert.strictEqual(stats.pending, 1);
    assert.strictEqual(stats.decided_percentage, 75);

    const md = generateMarkdownExport("CS-2024 Final Submissions", stats, [
      {
        type: "pair",
        label: "S-01 vs S-02",
        choice: "FLAG",
        note: "Check lab partner list",
        detail: "Contradiction in experimental results: 45 vs 120 iterations",
      },
    ]);

    assert.strictEqual(md.includes("# Margin Review Summary: CS-2024 Final Submissions"), true);
    assert.strictEqual(md.includes("Flagged for Follow-up | 1"), true);
    assert.strictEqual(md.includes("Contradiction in experimental results"), true);
  });
});
