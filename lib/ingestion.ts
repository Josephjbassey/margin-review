import mammoth from "mammoth";

export interface ParsedDocument {
  filename: string;
  kind: "submission" | "reading";
  text: string;
  label: string;
}

/**
 * Extracts raw plain text from a file buffer (.txt or .docx).
 */
export async function extractTextFromFile(
  filename: string,
  buffer: Buffer
): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (ext === "docx") {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value.replace(/\r\n/g, "\n").trim();
    } catch {
      // Fallback to utf-8 string if not a valid docx zip archive
      return buffer.toString("utf-8").replace(/\r\n/g, "\n").trim();
    }
  }

  // Default to utf-8 text (.txt and other plain text)
  return buffer.toString("utf-8").replace(/\r\n/g, "\n").trim();
}

/**
 * Generates an anonymous sequential label for a document.
 * e.g. kind === 'submission' -> 'S-01', 'S-02', ...
 *      kind === 'reading' -> 'R-01', 'R-02', ...
 */
export function formatDocumentLabel(
  kind: "submission" | "reading",
  index: number
): string {
  const prefix = kind === "submission" ? "S" : "R";
  const num = String(index).padStart(2, "0");
  return `${prefix}-${num}`;
}

/**
 * Processes a batch of uploaded files into parsed document objects with sequential labels.
 */
export async function ingestFiles(
  submissions: Array<{ name: string; buffer: Buffer }>,
  readingPack: Array<{ name: string; buffer: Buffer }>
): Promise<ParsedDocument[]> {
  const results: ParsedDocument[] = [];

  for (let i = 0; i < submissions.length; i++) {
    const file = submissions[i];
    const text = await extractTextFromFile(file.name, file.buffer);
    results.push({
      filename: file.name,
      kind: "submission",
      text,
      label: formatDocumentLabel("submission", i + 1),
    });
  }

  for (let j = 0; j < readingPack.length; j++) {
    const file = readingPack[j];
    const text = await extractTextFromFile(file.name, file.buffer);
    results.push({
      filename: file.name,
      kind: "reading",
      text,
      label: formatDocumentLabel("reading", j + 1),
    });
  }

  return results;
}
