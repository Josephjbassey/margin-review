import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { highlightOffsets, escapeHtml } from "../lib/highlight";

describe("highlight.ts - Evidence Highlighting Utility", () => {
  it("escapes HTML entities properly", () => {
    const raw = `This is <script>alert("XSS & danger")</script>`;
    const escaped = escapeHtml(raw);
    assert.strictEqual(
      escaped,
      `This is &lt;script&gt;alert(&quot;XSS &amp; danger&quot;)&lt;/script&gt;`
    );
  });

  it("highlights a single simple range", () => {
    const text = "The quick brown fox jumps over the lazy dog";
    const result = highlightOffsets(text, [{ char_start: 4, char_end: 9 }]);
    assert.strictEqual(
      result,
      `The <mark class="evidence-highlight">quick</mark> brown fox jumps over the lazy dog`
    );
  });

  it("handles overlapping ranges by merging them", () => {
    const text = "Computational complexity theory categorizes problems.";
    // Overlap: [0, 13] ("Computational") and [10, 24] ("nal complexity")
    const result = highlightOffsets(text, [
      { char_start: 0, char_end: 13 },
      { char_start: 10, char_end: 24 },
    ]);
    assert.strictEqual(
      result,
      `<mark class="evidence-highlight">Computational complexity</mark> theory categorizes problems.`
    );
  });

  it("handles adjacent ranges by merging them into one mark", () => {
    const text = "1234567890";
    const result = highlightOffsets(text, [
      { char_start: 0, char_end: 5 },
      { char_start: 5, char_end: 10 },
    ]);
    assert.strictEqual(
      result,
      `<mark class="evidence-highlight">1234567890</mark>`
    );
  });

  it("safely clamps out-of-range and negative offsets", () => {
    const text = "Simple text";
    // -10 to 6 -> clamped to 0 to 6 ("Simple")
    // 7 to 999 -> clamped to 7 to 11 ("text")
    const result = highlightOffsets(text, [
      { char_start: -10, char_end: 6 },
      { char_start: 7, char_end: 999 },
    ]);
    assert.strictEqual(
      result,
      `<mark class="evidence-highlight">Simple</mark> <mark class="evidence-highlight">text</mark>`
    );
  });

  it("ignores invalid inverted offsets where start >= end", () => {
    const text = "Sample content";
    const result = highlightOffsets(text, [
      { char_start: 10, char_end: 5 }, // inverted
      { char_start: 7, char_end: 7 }, // zero-length
      { char_start: 0, char_end: 6 }, // valid "Sample"
    ]);
    assert.strictEqual(
      result,
      `<mark class="evidence-highlight">Sample</mark> content`
    );
  });

  it("escapes malicious HTML both inside and outside the highlight", () => {
    const text = `<b>Unsafe</b> and <img src=x onerror=alert(1)>`;
    // highlight from index 0 to 13 (`<b>Unsafe</b>`)
    const result = highlightOffsets(text, [{ char_start: 0, char_end: 13 }]);
    assert.strictEqual(
      result,
      `<mark class="evidence-highlight">&lt;b&gt;Unsafe&lt;/b&gt;</mark> and &lt;img src=x onerror=alert(1)&gt;`
    );
  });

  it("returns escaped original text when ranges array is empty", () => {
    const text = "Plain text <no markup>";
    const result = highlightOffsets(text, []);
    assert.strictEqual(result, "Plain text &lt;no markup&gt;");
  });
});
