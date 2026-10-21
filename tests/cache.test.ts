import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  canonicalJson,
  computeCacheKey,
  getCachedResponse,
  setCachedResponse,
  clearCache,
  isInvalidResponse,
} from "../lib/clocked/cache";

describe("cache.ts - Clocked Disk Cache", () => {
  beforeEach(() => {
    clearCache();
  });

  afterEach(() => {
    clearCache();
  });

  it("canonicalJson produces deterministic strings regardless of key insertion order", () => {
    const obj1 = { b: 2, a: 1, c: { z: 26, y: 25 } };
    const obj2 = { a: 1, c: { y: 25, z: 26 }, b: 2 };

    assert.strictEqual(canonicalJson(obj1), canonicalJson(obj2));
    assert.strictEqual(
      canonicalJson(obj1),
      '{"a":1,"b":2,"c":{"y":25,"z":26}}'
    );
  });

  it("computeCacheKey creates stable sha256 hashes", () => {
    const key1 = computeCacheKey("/compare", { textA: "Hello", textB: "World" });
    const key2 = computeCacheKey("/compare", { textB: "World", textA: "Hello" });
    assert.strictEqual(key1, key2);
    assert.strictEqual(key1.length, 64);
  });

  it("caches successful responses and returns cache hit", () => {
    const payload = { document_a: "S-01 text", document_b: "S-02 text" };
    const key = computeCacheKey("/compare", payload);

    assert.strictEqual(getCachedResponse(key), null);

    const sampleResponse = {
      relation: "conflict",
      probability: 0.94,
      passages_a: [{ char_start: 10, char_end: 25, text: "fact A" }],
      passages_b: [{ char_start: 12, char_end: 27, text: "fact B" }],
    };

    const saved = setCachedResponse(key, "/compare", payload, sampleResponse, 15);
    assert.strictEqual(saved, true);

    const hit = getCachedResponse(key);
    assert.notStrictEqual(hit, null);
    assert.strictEqual(hit?.credits, 15);
    assert.deepStrictEqual(hit?.data, sampleResponse);
  });

  it("NEVER caches failed or empty responses", () => {
    const key = computeCacheKey("/protect", { text: "student name" });

    // Empty object
    assert.strictEqual(isInvalidResponse({}), true);
    assert.strictEqual(setCachedResponse(key, "/protect", {}, {}), false);

    // Error response
    const errorResponse = { error: "Rate limit exceeded", status: "error" };
    assert.strictEqual(isInvalidResponse(errorResponse), true);
    assert.strictEqual(
      setCachedResponse(key, "/protect", {}, errorResponse),
      false
    );

    // Cache should remain empty
    assert.strictEqual(getCachedResponse(key), null);
  });

  it("clearCache deletes all cached files", () => {
    const key1 = computeCacheKey("/protect", { text: "1" });
    const key2 = computeCacheKey("/protect", { text: "2" });

    setCachedResponse(key1, "/protect", { text: "1" }, { masked: "1" });
    setCachedResponse(key2, "/protect", { text: "2" }, { masked: "2" });

    assert.notStrictEqual(getCachedResponse(key1), null);
    assert.notStrictEqual(getCachedResponse(key2), null);

    const clearedCount = clearCache();
    assert.strictEqual(clearedCount >= 2, true);

    assert.strictEqual(getCachedResponse(key1), null);
    assert.strictEqual(getCachedResponse(key2), null);
  });
});
