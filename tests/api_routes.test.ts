import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getBatch, getAllBatches, saveBatch } from "../lib/storage";
import { recordDecision, computeDecisionsStats, generateMarkdownExport } from "../lib/decisions";

describe("API & Storage Logic Integrity Tests", () => {
  it("retrieves the default pre-seeded demo batch", () => {
    const demo = getBatch("batch-demo-gns102");
    assert.ok(demo, "Demo batch should exist");
    assert.strictEqual(demo.id, "batch-demo-gns102");
    assert.ok(demo.submissions.length >= 6, "Demo should have at least 6 submissions");
    assert.ok(demo.reading_pack.length >= 2, "Demo should have at least 2 reading pack docs");
    assert.ok(demo.pair_findings.length > 0, "Demo should have pair findings");
    assert.ok(demo.claim_findings.length > 0, "Demo should have claim findings");
  });

  it("returns null for non-existent batch IDs without throwing", () => {
    const nonExistent = getBatch("batch-does-not-exist-9999");
    assert.strictEqual(nonExistent, null);
  });

  it("lists all batches including demo batch", () => {
    const batches = getAllBatches();
    assert.ok(Array.isArray(batches), "getAllBatches should return an array");
    const foundDemo = batches.find((b) => b.id === "batch-demo-gns102");
    assert.ok(foundDemo, "Demo batch should be in the returned batch list");
  });

  it("records decisions and computes accurate statistics without NaN or fake percentages", () => {
    const testBatchId = `test-batch-${Date.now()}`;
    const d1 = recordDecision(testBatchId, "pair", "finding-1", "dismiss", "Normal scholarly citation");
    assert.strictEqual(d1.choice, "dismiss");
    assert.strictEqual(d1.finding_type, "pair");

    const d2 = recordDecision(testBatchId, "claim", "finding-2", "flag", "Suspicious claim");
    assert.strictEqual(d2.choice, "flag");

    const stats = computeDecisionsStats(10, [d1, d2]);
    assert.strictEqual(stats.total, 10);
    assert.strictEqual(stats.total - stats.pending, 2);
    assert.strictEqual(stats.pending, 8);
    assert.strictEqual(stats.dismissed, 1);
    assert.strictEqual(stats.flagged, 1);
    assert.strictEqual(stats.common_source, 0);

    // Percentages
    assert.strictEqual(stats.decided_percentage, 20);
  });

  it("computes stats safely when total findings is zero", () => {
    const stats = computeDecisionsStats(0, []);
    assert.strictEqual(stats.total, 0);
    assert.strictEqual(stats.pending, 0);
    assert.strictEqual(stats.decided_percentage, 0);
  });

  it("generates markdown export correctly with flagged items and audit notes", () => {
    const stats = computeDecisionsStats(2, [
      {
        id: "d-1",
        batch_id: "b-1",
        finding_type: "pair",
        finding_id: "f-1",
        choice: "flag",
        note: "Direct contradiction found in experiments",
        decided_at: new Date().toISOString(),
      },
    ]);

    const flaggedItems = [
      {
        type: "pair" as const,
        label: "S-01 vs S-02",
        choice: "flag",
        note: "Direct contradiction found in experiments",
        detail: "Relation: CONFLICT (94.2%). Discrepancy on iteration counts.",
      },
    ];

    const md = generateMarkdownExport("GNS102 Review Batch", stats, flaggedItems);
    assert.ok(md.includes("# Margin Review Summary: GNS102 Review Batch"), "Should have header title");
    assert.ok(md.includes("Direct contradiction found in experiments"), "Should include audit note");
    assert.ok(md.includes("S-01 vs S-02"), "Should include flagged item label");
  });
});
