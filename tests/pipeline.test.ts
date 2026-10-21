import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  generatePairs,
  runCompareStep,
  PipelineDocument,
  PipelineStepProgress,
} from "../lib/pipeline";
import { clearCache } from "../lib/clocked/cache";

describe("pipeline.ts - Compare Step", () => {
  beforeEach(() => {
    clearCache();
  });

  it("generatePairs produces exact n(n-1)/2 unique pairwise combinations", () => {
    const items = ["S-01", "S-02", "S-03", "S-04"];
    const pairs = generatePairs(items);
    // 4*3/2 = 6
    assert.strictEqual(pairs.length, 6);
    assert.deepStrictEqual(pairs[0], ["S-01", "S-02"]);
    assert.deepStrictEqual(pairs[1], ["S-01", "S-03"]);
    assert.deepStrictEqual(pairs[2], ["S-01", "S-04"]);
    assert.deepStrictEqual(pairs[3], ["S-02", "S-03"]);
    assert.deepStrictEqual(pairs[4], ["S-02", "S-04"]);
    assert.deepStrictEqual(pairs[5], ["S-03", "S-04"]);
  });

  it("runCompareStep enforces MAX_PAIRS guard and stops immediately", async () => {
    // 10 submissions = 45 pairs > default MAX_PAIRS (20)
    const mockSubmissions: PipelineDocument[] = Array.from({ length: 10 }).map(
      (_, i) => ({
        id: `doc-${i + 1}`,
        filename: `essay_${i + 1}.txt`,
        kind: "submission",
        text: `Content for submission ${i + 1}`,
        masked_text: `Content for submission ${i + 1}`,
        label: `S-0${i + 1}`,
      })
    );

    const progressLogs: PipelineStepProgress[] = [];
    await assert.rejects(
      async () => {
        await runCompareStep(mockSubmissions, (p) => {
          progressLogs.push(p);
        });
      },
      (err: Error) => {
        return err.message.includes("Batch exceeds limit: 45 pairs requested");
      }
    );

    assert.strictEqual(progressLogs.length, 1);
    assert.strictEqual(progressLogs[0].state, "error");
  });

  it("runCompareStep processes pairs, tracks progress, and sorts conflicts first", async () => {
    const docs: PipelineDocument[] = [
      {
        id: "d1",
        filename: "essay1.txt",
        kind: "submission",
        text: "The global temperature rose by 1.5C by 2020.",
        masked_text: "The global temperature rose by 1.5C by 2020.",
        label: "S-01",
      },
      {
        id: "d2",
        filename: "essay2.txt",
        kind: "submission",
        text: "The global temperature rose by 0.8C by 2020.",
        masked_text: "The global temperature rose by 0.8C by 2020.",
        label: "S-02",
      },
      {
        id: "d3",
        filename: "essay3.txt",
        kind: "submission",
        text: "Renewable energy adoption reached historic peaks in 2022.",
        masked_text: "Renewable energy adoption reached historic peaks in 2022.",
        label: "S-03",
      },
    ];

    const progressStates: PipelineStepProgress[] = [];

    // Mock compare generator simulating conflict between S-01 and S-02
    const findings = await runCompareStep(
      docs,
      (p) => {
        progressStates.push({ ...p });
      },
      (docA, docB) => {
        if (
          (docA.label === "S-01" && docB.label === "S-02") ||
          (docA.label === "S-02" && docB.label === "S-01")
        ) {
          return {
            relation: "conflict",
            probability: 0.94,
            passages_a: [{ char_start: 31, char_end: 35, text: "1.5C" }],
            passages_b: [{ char_start: 31, char_end: 35, text: "0.8C" }],
            raw_response: { test: true },
          };
        }
        return {
          relation: "none",
          probability: 0.1,
          passages_a: [],
          passages_b: [],
          raw_response: { test: true },
        };
      }
    );

    // 3 submissions -> 3 pairs
    assert.strictEqual(findings.length, 3);

    // Conflicts prioritized first!
    assert.strictEqual(findings[0].relation, "conflict");
    assert.strictEqual(findings[0].doc_a.label, "S-01");
    assert.strictEqual(findings[0].doc_b.label, "S-02");
    assert.strictEqual(findings[0].passages_a[0].text, "1.5C");

    // Progress updates recorded
    assert.strictEqual(progressStates[0].state, "running");
    assert.strictEqual(progressStates[progressStates.length - 1].state, "done");
    assert.strictEqual(progressStates[progressStates.length - 1].done, 3);
  });
});
