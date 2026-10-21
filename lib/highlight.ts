/**
 * Safely escapes HTML special characters to prevent XSS.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface HighlightRange {
  char_start: number;
  char_end: number;
  className?: string;
}

/**
 * Highlights character offset ranges in a text string.
 *
 * Requirements:
 * - HTML-escapes all text segments safely.
 * - Handles overlapping ranges by merging them into contiguous highlight blocks.
 * - Safely handles out-of-range offsets (clamped or discarded if invalid).
 * - Wraps highlighted ranges in <mark class="...">.
 */
export function highlightOffsets(
  text: string,
  ranges: HighlightRange[],
  defaultClassName: string = "evidence-highlight"
): string {
  if (!text) return "";
  if (!ranges || ranges.length === 0) return escapeHtml(text);

  const textLength = text.length;

  // 1. Sanitize and clamp ranges
  const validRanges: Array<{ start: number; end: number; className: string }> = [];

  for (const r of ranges) {
    if (typeof r.char_start !== "number" || typeof r.char_end !== "number") {
      continue;
    }

    const start = Math.max(0, Math.min(r.char_start, textLength));
    const end = Math.max(0, Math.min(r.char_end, textLength));

    if (start < end) {
      validRanges.push({
        start,
        end,
        className: r.className || defaultClassName,
      });
    }
  }

  if (validRanges.length === 0) {
    return escapeHtml(text);
  }

  // 2. Sort by start ascending, then end descending
  validRanges.sort((a, b) => {
    if (a.start !== b.start) {
      return a.start - b.start;
    }
    return b.end - a.end;
  });

  // 3. Merge overlapping or adjacent ranges
  const merged: Array<{ start: number; end: number; className: string }> = [];
  let current = validRanges[0];

  for (let i = 1; i < validRanges.length; i++) {
    const next = validRanges[i];
    if (next.start <= current.end) {
      // Overlapping or contiguous: expand current
      current.end = Math.max(current.end, next.end);
    } else {
      merged.push(current);
      current = next;
    }
  }
  merged.push(current);

  // 4. Construct safe HTML output
  let html = "";
  let lastIndex = 0;

  for (const range of merged) {
    if (range.start > lastIndex) {
      html += escapeHtml(text.slice(lastIndex, range.start));
    }
    const highlightedSegment = escapeHtml(text.slice(range.start, range.end));
    html += `<mark class="${escapeHtml(range.className)}">${highlightedSegment}</mark>`;
    lastIndex = range.end;
  }

  if (lastIndex < textLength) {
    html += escapeHtml(text.slice(lastIndex));
  }

  return html;
}
