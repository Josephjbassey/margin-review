import { NextResponse } from "next/server";
import { ingestFiles } from "@/lib/ingestion";
import { saveBatch, getAllBatches, StoredBatch } from "@/lib/storage";
import { validatePairLimit } from "@/lib/clocked/client";

export async function GET() {
  try {
    const batches = getAllBatches();
    return NextResponse.json({ batches });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = (formData.get("name") as string) || "Untitled Review Batch";

    const submissionFiles: Array<{ name: string; buffer: Buffer }> = [];
    const readingFiles: Array<{ name: string; buffer: Buffer }> = [];

    // Parse form files
    for (const [key, value] of formData.entries()) {
      if (key === "submissions" && value instanceof File) {
        const bytes = await value.arrayBuffer();
        submissionFiles.push({
          name: value.name,
          buffer: Buffer.from(bytes),
        });
      } else if (key === "reading_pack" && value instanceof File) {
        const bytes = await value.arrayBuffer();
        readingFiles.push({
          name: value.name,
          buffer: Buffer.from(bytes),
        });
      }
    }

    if (submissionFiles.length < 2) {
      return NextResponse.json(
        { error: "At least two submission files are required for pairwise review." },
        { status: 400 }
      );
    }

    // Check MAX_PAIRS guard
    const guard = validatePairLimit(submissionFiles.length);
    if (!guard.allowed) {
      return NextResponse.json(
        {
          error: `Batch exceeds system limit: ${guard.pairCount} pairs requested, but MAX_PAIRS is set to ${guard.maxPairs}. Please reduce the number of submissions.`,
        },
        { status: 400 }
      );
    }

    // Ingest files
    const parsed = await ingestFiles(submissionFiles, readingFiles);

    const submissions = parsed
      .filter((d) => d.kind === "submission")
      .map((d, i) => ({
        id: `doc-sub-${Date.now()}-${i + 1}`,
        filename: d.filename,
        kind: d.kind,
        text: d.text,
        masked_text: "",
        label: d.label,
      }));

    const readingPack = parsed
      .filter((d) => d.kind === "reading")
      .map((d, i) => ({
        id: `doc-read-${Date.now()}-${i + 1}`,
        filename: d.filename,
        kind: d.kind,
        text: d.text,
        masked_text: d.text,
        label: d.label,
      }));

    const batchId = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const newBatch: StoredBatch = {
      id: batchId,
      name,
      created_at: new Date().toISOString(),
      status: "running",
      current_step: "protect",
      submissions,
      reading_pack: readingPack,
      pair_findings: [],
      claim_findings: [],
      decisions: [],
      progress: {
        ingest: {
          step: "ingest",
          done: parsed.length,
          total: parsed.length,
          state: "done",
        },
        protect: {
          step: "protect",
          done: 0,
          total: submissions.length,
          state: "pending",
        },
        compare: {
          step: "compare",
          done: 0,
          total: guard.pairCount,
          state: "pending",
        },
        verify: {
          step: "verify",
          done: 0,
          total: submissions.length,
          state: "pending",
        },
        rerank: {
          step: "rerank",
          done: 0,
          total: 0,
          state: "pending",
        },
      },
      total_identifiers_masked: 0,
    };

    saveBatch(newBatch);

    return NextResponse.json({
      id: batchId,
      name: newBatch.name,
      status: newBatch.status,
    });
  } catch (error: any) {
    console.error("[Create Batch Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
