import { NextResponse } from "next/server";
import { getBatch, saveBatch } from "@/lib/storage";
import { recordDecision, FindingType, DecisionChoice } from "@/lib/decisions";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batch = getBatch(id);

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const body = await req.json();
    const { finding_type, finding_id, choice, note } = body as {
      finding_type: FindingType;
      finding_id: string;
      choice: DecisionChoice;
      note?: string;
    };

    if (!finding_type || !finding_id || !choice) {
      return NextResponse.json(
        { error: "finding_type, finding_id, and choice are required." },
        { status: 400 }
      );
    }

    const decision = recordDecision(id, finding_type, finding_id, choice, note || "");

    // Update in batch object
    const existingIndex = batch.decisions.findIndex(
      (d) => d.finding_id === finding_id && d.finding_type === finding_type
    );
    if (existingIndex >= 0) {
      batch.decisions[existingIndex] = decision;
    } else {
      batch.decisions.push(decision);
    }

    saveBatch(batch);

    return NextResponse.json({ success: true, decision, decisions: batch.decisions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
