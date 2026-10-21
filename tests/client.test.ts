import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validatePairLimit,
  protect,
  compare,
  verify,
  rerank,
  MAX_PAIRS,
} from "../lib/clocked/client";
import { clockedAdapters } from "../lib/clocked/adapters";

describe("client.ts - Clocked Client & Guard", () => {
  it("enforces MAX_PAIRS guard calculation properly", () => {
    // 5 submissions -> 5*4/2 = 10 pairs (allowed if MAX_PAIRS >= 10)
    const check5 = validatePairLimit(5);
    assert.strictEqual(check5.pairCount, 10);
    assert.strictEqual(check5.allowed, 10 <= MAX_PAIRS);

    // 10 submissions -> 10*9/2 = 45 pairs (refused if MAX_PAIRS = 20)
    const check10 = validatePairLimit(10);
    assert.strictEqual(check10.pairCount, 45);
    assert.strictEqual(check10.allowed, 45 <= MAX_PAIRS);
  });

  it("adapter correctly normalizes protect responses", () => {
    const raw = {
      masked_text: "Student [STUDENT_01] submitted the paper.",
      entities: [{ type: "NAME", value: "Alice Smith" }],
    };
    const adapted = clockedAdapters.protect.fromResponse(raw, "Alice Smith submitted the paper.");
    assert.strictEqual(adapted.masked_text, "Student [STUDENT_01] submitted the paper.");
    assert.strictEqual(adapted.entities_masked_count, 1);
  });

  it("adapter correctly normalizes compare responses with relation and passages", () => {
    const raw = {
      relation: "conflict",
      probability: 0.95,
      passages_a: [{ char_start: 10, char_end: 30, text: "The model achieved 95%" }],
      passages_b: [{ char_start: 12, char_end: 32, text: "The model achieved 62%" }],
    };
    const adapted = clockedAdapters.compare.fromResponse(raw);
    assert.strictEqual(adapted.relation, "conflict");
    assert.strictEqual(adapted.probability, 0.95);
    assert.strictEqual(adapted.passages_a.length, 1);
    assert.strictEqual(adapted.passages_a[0].char_start, 10);
  });

  it("client executes protect with mock fallback when offline", async () => {
    const res = await protect("Student John Doe, matric 2024/001", () => ({
      masked_text: "Student [STUDENT_01], matric [MATRIC_01]",
      entities_masked_count: 2,
      raw_response: { mocked: true },
    }));

    assert.strictEqual(res.masked_text, "Student [STUDENT_01], matric [MATRIC_01]");
    assert.strictEqual(res.entities_masked_count, 2);
  });

  it("client executes compare with mock fallback when offline", async () => {
    const res = await compare(
      { id: "S-01", text: "Text A" },
      { id: "S-02", text: "Text B" },
      () => ({
        relation: "same_facts",
        probability: 0.88,
        passages_a: [{ char_start: 0, char_end: 6, text: "Text A" }],
        passages_b: [{ char_start: 0, char_end: 6, text: "Text B" }],
        raw_response: { mocked: true },
      })
    );

    assert.strictEqual(res.relation, "same_facts");
    assert.strictEqual(res.probability, 0.88);
  });
});
