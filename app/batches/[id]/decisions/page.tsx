"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { StoredBatch } from "@/lib/storage";
import { BatchNav } from "@/components/BatchNav";
import { FooterBand } from "@/components/FooterBand";
import { computeDecisionsStats } from "@/lib/decisions";

export default function DecisionsSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [batch, setBatch] = useState<StoredBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadBatch() {
      try {
        const res = await fetch(`/api/batches/${id}`);
        if (!res.ok) throw new Error("Failed to load batch");
        const data = await res.json();
        setBatch(data.batch);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadBatch();
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "80px 0" }}>
        <div className="label-mono text-muted">Loading decisions summary...</div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="container">
        <div className="card" style={{ borderColor: "#900", color: "#900" }}>
          Failed to load batch: {error}
        </div>
        <Link href="/" className="btn btn-secondary" style={{ marginTop: 16 }}>
          ← Back to Batches
        </Link>
      </div>
    );
  }

  const decisions = batch.decisions || [];
  const totalPairs = batch.pair_findings?.filter((p) => p.relation !== "none")?.length || 0;
  const totalClaims = batch.claim_findings?.length || 0;
  const totalFindings = totalPairs + totalClaims;
  const stats = computeDecisionsStats(totalFindings, decisions);
  const pendingCount = stats.pending;

  const handleCopyMarkdown = async () => {
    try {
      const res = await fetch(`/api/batches/${id}/export`);
      if (res.ok) {
        const text = await res.text();
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      console.error("Failed to copy export:", e);
    }
  };

  return (
    <div>
      <BatchNav
        batchId={batch.id}
        batchName={batch.name}
        maskedCount={batch.total_identifiers_masked}
        totalSubmissions={batch.submissions.length}
      />

      <div className="container" style={{ paddingTop: 0, paddingBottom: 120 }}>
        {/* Header Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h1 className="page-title" style={{ margin: 0, fontSize: 36 }}>
              Decisions Summary
            </h1>
            <p className="text-muted" style={{ margin: "4px 0 0 0", fontSize: 15 }}>
              Audit report of lecturer determinations across pairwise alignments and grounded claims.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleCopyMarkdown}
              className="btn btn-secondary"
            >
              {copied ? "✓ Copied to Clipboard" : "📋 Copy Markdown"}
            </button>
            <a
              href={`/api/batches/${id}/export`}
              download={`${batch.id}-report.md`}
              className="btn btn-primary"
            >
              ↓ Download Report (.md)
            </a>
          </div>
        </div>

        {/* 4 Diagnostic Stat Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div className="card">
            <div className="caption-mono text-muted">FLAGGED FOR FOLLOW-UP</div>
            <div style={{ fontSize: 36, fontWeight: 700, margin: "8px 0", color: "var(--ink)" }}>
              {stats.flagged}
            </div>
            <div className="label-mono text-muted" style={{ fontSize: 11 }}>
              Requires interview or investigation
            </div>
          </div>

          <div className="card">
            <div className="caption-mono text-muted">COMMON SOURCE</div>
            <div style={{ fontSize: 36, fontWeight: 700, margin: "8px 0" }}>
              {stats.common_source}
            </div>
            <div className="label-mono text-muted" style={{ fontSize: 11 }}>
              Shared template or lecture material
            </div>
          </div>

          <div className="card">
            <div className="caption-mono text-muted">DISMISSED / ACCEPTED</div>
            <div style={{ fontSize: 36, fontWeight: 700, margin: "8px 0" }}>
              {stats.dismissed}
            </div>
            <div className="label-mono text-muted" style={{ fontSize: 11 }}>
              Cleared as original or routine
            </div>
          </div>

          <div className="card">
            <div className="caption-mono text-muted">PENDING REVIEW</div>
            <div style={{ fontSize: 36, fontWeight: 700, margin: "8px 0" }}>
              {stats.pending}
            </div>
            <div className="label-mono text-muted" style={{ fontSize: 11 }}>
              Out of {totalFindings} total findings
            </div>
          </div>
        </div>

        {/* Decisions Table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "12px 20px",
              backgroundColor: "var(--paper)",
              borderBottom: "1px solid var(--ink)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span className="caption-mono text-muted" style={{ fontWeight: 700 }}>
              DECISION AUDIT LOG ({decisions.length} RECORDED)
            </span>
            <span className="caption-mono text-muted">
              FERPA Isolated Record
            </span>
          </div>

          {decisions.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <p className="text-muted" style={{ margin: "0 0 16px 0" }}>
                No lecturer decisions recorded yet.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                <Link href={`/batches/${id}/overlap`} className="btn btn-primary">
                  Review Overlap Findings
                </Link>
                <Link href={`/batches/${id}/claims`} className="btn btn-secondary">
                  Review Grounded Claims
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {decisions.map((d) => {
                let subjectTitle = d.finding_id;
                let linkUrl = `/batches/${id}/overlap`;

                if (d.finding_type === "pair") {
                  const pair = batch.pair_findings?.find((p) => p.id === d.finding_id);
                  if (pair) {
                    subjectTitle = `Pair ${pair.doc_a.label} ↔ ${pair.doc_b.label} (${pair.relation})`;
                  }
                  linkUrl = `/batches/${id}/overlap`;
                } else {
                  const claim = batch.claim_findings?.find((c) => c.id === d.finding_id);
                  if (claim) {
                    subjectTitle = `${claim.document.label}: "${claim.text}"`;
                  }
                  linkUrl = `/batches/${id}/claims`;
                }

                let choiceTagClass = "tag-same_facts";
                if (d.choice === "flag") choiceTagClass = "tag-conflict";
                if (d.choice === "dismiss") choiceTagClass = "tag-draft";

                return (
                  <div
                    key={d.id}
                    className="list-row"
                    style={{
                      padding: "16px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 16,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span className="caption-mono tag tag-draft">
                          {d.finding_type === "pair" ? "PAIR OVERLAP" : "CLAIM"}
                        </span>
                        <strong style={{ fontSize: 14 }}>{subjectTitle}</strong>
                      </div>
                      {d.note && (
                        <p
                          className="caption-mono"
                          style={{
                            margin: "4px 0 0 0",
                            color: "var(--ink)",
                            backgroundColor: "var(--paper)",
                            padding: "4px 8px",
                            display: "inline-block",
                            borderRadius: 2,
                          }}
                        >
                          Lecturer Note: "{d.note}"
                        </p>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span className={`tag ${choiceTagClass}`} style={{ fontWeight: 700 }}>
                        {d.choice.toUpperCase().replace("_", " ")}
                      </span>
                      <span className="caption-mono text-muted">
                        {new Date(d.decided_at).toLocaleDateString()}
                      </span>
                      <Link href={linkUrl} className="btn btn-secondary btn-sm">
                        View Evidence →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <FooterBand
        note="Protect · Complete audit trail · Margin flags, human decides"
        metric="Export Engine Ready"
      />
    </div>
  );
}
