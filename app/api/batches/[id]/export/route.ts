import { NextResponse } from "next/server";
import { getBatch } from "@/lib/storage";
import { computeDecisionsStats, generateMarkdownExport } from "@/lib/decisions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batch = getBatch(id);

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const totalFindings = batch.pair_findings.length + batch.claim_findings.length;
    const stats = computeDecisionsStats(totalFindings, batch.decisions);

    const flaggedItems: Array<{
      type: "pair" | "claim";
      label: string;
      choice: string;
      note?: string;
      detail: string;
    }> = [];

    // Add flagged pairs
    for (const p of batch.pair_findings) {
      const dec = batch.decisions.find(
        (d) => d.finding_id === p.id && d.finding_type === "pair"
      );
      if (dec && dec.choice === "flag") {
        flaggedItems.push({
          type: "pair",
          label: `${p.doc_a.label} vs ${p.doc_b.label}`,
          choice: dec.choice,
          note: dec.note,
          detail: `Relation: ${p.relation.toUpperCase()} (${(p.probability * 100).toFixed(1)}%). ${
            p.passages_a[0] ? `Passage: "${p.passages_a[0].text}"` : ""
          }`,
        });
      }
    }

    // Add flagged claims
    for (const c of batch.claim_findings) {
      const dec = batch.decisions.find(
        (d) => d.finding_id === c.id && d.finding_type === "claim"
      );
      if (dec && (dec.choice === "flag" || dec.choice === "cite")) {
        flaggedItems.push({
          type: "claim",
          label: `${c.document.label} Claim`,
          choice: dec.choice,
          note: dec.note,
          detail: `Claim: "${c.text}". Status: ${c.status.toUpperCase()}. ${
            c.evidence[0] ? `Evidence: "${c.evidence[0].passage_text}"` : ""
          }`,
        });
      }
    }

    const markdown = generateMarkdownExport(batch.name, stats, flaggedItems);

    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="margin_review_${batch.id}.md"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
