import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const sampleDir = path.join(process.cwd(), "sample_data");
    const files = fs.readdirSync(/*turbopackIgnore: true*/ sampleDir);

    const submissions: Array<{ name: string; content: string }> = [];
    const readingPack: Array<{ name: string; content: string }> = [];

    for (const f of files) {
      if (f.endsWith(".json")) continue;
      const content = fs.readFileSync(path.join(sampleDir, f), "utf-8");
      if (f.startsWith("essay_")) {
        submissions.push({ name: f, content });
      } else if (f.startsWith("reading_")) {
        readingPack.push({ name: f, content });
      }
    }

    return NextResponse.json({ submissions, readingPack });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to read sample files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
