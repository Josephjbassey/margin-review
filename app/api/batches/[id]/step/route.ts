import { NextResponse } from "next/server";
import { getBatch, saveBatch } from "@/lib/storage";
import {
  runProtectStep,
  runCompareStep,
  runVerifyStep,
  runRerankStep,
} from "@/lib/pipeline";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batch = getBatch(id);

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    if (batch.status === "done") {
      return NextResponse.json({ batch, finished: true });
    }

    const step = batch.current_step;

    // STEP 1 / 2: PROTECT
    if (step === "protect") {
      const { maskedSubmissions, totalIdentifiersMasked } = await runProtectStep(
        batch.submissions,
        (p) => {
          batch.progress.protect = p;
        }
      );

      batch.submissions = maskedSubmissions;
      batch.total_identifiers_masked = totalIdentifiersMasked;
      batch.current_step = "compare";
      saveBatch(batch);

      return NextResponse.json({ batch, next_step: "compare", finished: false });
    }

    // STEP 3: COMPARE
    if (step === "compare") {
      const findings = await runCompareStep(
        batch.submissions,
        (p) => {
          batch.progress.compare = p;
        }
      );

      batch.pair_findings = findings;
      batch.current_step = "verify";
      saveBatch(batch);

      return NextResponse.json({ batch, next_step: "verify", finished: false });
    }

    // STEP 4: VERIFY
    if (step === "verify") {
      const claims = await runVerifyStep(
        batch.submissions,
        batch.reading_pack,
        (p) => {
          batch.progress.verify = p;
        }
      );

      batch.claim_findings = claims;
      batch.current_step = "rerank";
      saveBatch(batch);

      return NextResponse.json({ batch, next_step: "rerank", finished: false });
    }

    // STEP 5: RERANK
    if (step === "rerank") {
      const rerankedClaims = await runRerankStep(
        batch.claim_findings,
        batch.reading_pack,
        (p) => {
          batch.progress.rerank = p;
        }
      );

      batch.claim_findings = rerankedClaims;
      batch.current_step = "completed";
      batch.status = "done";
      saveBatch(batch);

      return NextResponse.json({ batch, next_step: "completed", finished: true });
    }

    return NextResponse.json({ batch, finished: true });
  } catch (error: unknown) {
    console.error("[Run Step Error]:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    try {
      const { id } = await params;
      const batch = getBatch(id);
      if (batch) {
        batch.status = "error";
        saveBatch(batch);
      }
    } catch {}
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
