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

describe("client.ts - Clocked Client & Official Schemas", () => {
  it("enforces MAX_PAIRS guard calculation properly", () => {
    // 5 submissions -> 5*4/2 = 10 pairs
    const check5 = validatePairLimit(5);
    assert.strictEqual(check5.pairCount, 10);
    assert.strictEqual(check5.allowed, 10 <= MAX_PAIRS);

    // 10 submissions -> 10*9/2 = 45 pairs
    const check10 = validatePairLimit(10);
    assert.strictEqual(check10.pairCount, 45);
    assert.strictEqual(check10.allowed, 45 <= MAX_PAIRS);
  });

  it("adapter correctly normalizes official Protect response", () => {
    const raw = {
      model: "clocked-1.0",
      anonymized_text: "Student <PERSON>, ID <STUDENT_ID>.",
      entities: [
        { type: "person", value: "Alex Chen", start: 8, end: 17, confidence: 1 },
        { type: "student_id", value: "CS-90214", start: 22, end: 30, confidence: 1 },
      ],
      counts: { person: 1, student_id: 1 },
    };
    const adapted = clockedAdapters.protect.fromResponse(raw, "Student Alex Chen, ID CS-90214.");
    assert.strictEqual(adapted.masked_text, "Student <PERSON>, ID <STUDENT_ID>.");
    assert.strictEqual(adapted.entities_masked_count, 2);
    assert.strictEqual(adapted.entities[0].value, "Alex Chen");
  });

  it("adapter correctly normalizes official Compare response with conflicts and duplicates", () => {
    const raw = {
      model: "clocked-1.0",
      verdict: "conflicts",
      pairs: [
        {
          a: "S-01",
          b: "S-02",
          relation: "conflicting",
          related: 0.94,
          probabilities: {
            conflicting: 0.94,
            same: 0.03,
            overlapping: 0.02,
            unrelated: 0.01,
          },
          conflicts: [
            {
              kind: "contradiction",
              confidence: 0.98,
              a: { document: "S-01", quote: "converged in 45 iterations", start: 10, end: 36 },
              b: { document: "S-02", quote: "converged in 120 iterations", start: 12, end: 39 },
            },
          ],
        },
      ],
    };

    const adapted = clockedAdapters.compare.fromResponse(raw);
    assert.strictEqual(adapted.relation, "conflict");
    assert.strictEqual(adapted.probability, 0.94);
    assert.strictEqual(adapted.passages_a.length, 1);
    assert.strictEqual(adapted.passages_a[0].char_start, 10);
    assert.strictEqual(adapted.passages_a[0].text, "converged in 45 iterations");
    assert.strictEqual(adapted.passages_b[0].text, "converged in 120 iterations");
  });

  it("adapter correctly normalizes official Verify (grounding) response", () => {
    const raw = {
      model: "clocked-1.0",
      grounded: 0.75,
      verdict: "partial",
      claims: [
        {
          claim: "The algorithm runs in polynomial time.",
          verdict: "supported",
          supported: 0.99,
          evidence: {
            document: "R-01",
            quote: "Theorem 4 states O(n^2) polynomial runtime.",
            start: 40,
            end: 83,
            confidence: 0.98,
          },
        },
        {
          claim: "It uses quantum teleportation.",
          verdict: "not_stated",
          supported: 0.01,
        },
      ],
      unsupported_claims: [1],
    };

    const adapted = clockedAdapters.verify.fromResponse(raw);
    assert.strictEqual(adapted.grounded_score, 0.75);
    assert.strictEqual(adapted.claims.length, 2);
    assert.strictEqual(adapted.claims[0].status, "supported");
    assert.strictEqual(adapted.claims[0].evidence[0].source_id, "R-01");
    assert.strictEqual(adapted.claims[1].status, "unsupported");
    assert.strictEqual(adapted.unsupported_claim_indexes[0], 1);
  });

  it("adapter correctly normalizes official Rerank response", () => {
    const raw = {
      model: "clocked-1.0",
      results: [
        {
          index: 2,
          id: "passage-3",
          action: "use",
          relevance_score: 0.992,
          document_score: 0.995,
        },
        {
          index: 0,
          id: "passage-1",
          action: "skip",
          reason: "unrelated",
          relevance_score: 0.05,
        },
      ],
    };

    const adapted = clockedAdapters.rerank.fromResponse(raw, "Search query");
    assert.strictEqual(adapted.results.length, 2);
    assert.strictEqual(adapted.results[0].action, "use");
    assert.strictEqual(adapted.results[0].relevance_score, 0.992);
    assert.strictEqual(adapted.results[1].action, "skip");
  });

  it("client executes protect with mock fallback when offline", async () => {
    const res = await protect("Student John Doe", () => ({
      masked_text: "Student <PERSON>",
      entities: [{ type: "person", value: "John Doe", start: 8, end: 16, confidence: 1 }],
      entities_masked_count: 1,
      raw_response: { mocked: true },
    }));

    assert.strictEqual(res.masked_text, "Student <PERSON>");
    assert.strictEqual(res.entities_masked_count, 1);
  });
});
