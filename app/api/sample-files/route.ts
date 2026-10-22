import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const sampleDir = path.join(process.cwd(), "sample_data");
    const files = fs.readdirSync(sampleDir);

    const submissions: Array<{ name: string; content: string }> = [];
    const readingPack: Array<{ name: string; content: string }> = [];

    for (const f of files) {
      const content = fs.readFileSync(path.join(sampleDir, f), "utf-8");
      if (f.startsWith("essay_")) {
        submissions.push({ name: f, content });
      } else if (f.startsWith("reading_")) {
        readingPack.push({ name: f, content });
      }
    }

    return NextResponse.json({ submissions, readingPack });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
