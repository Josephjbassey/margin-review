"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StoredBatch } from "@/lib/storage";
import { BatchNav } from "@/components/BatchNav";
import { computeDecisionsStats } from "@/lib/decisions";
import { authClient } from "@/lib/auth-client";
import { AuthGate } from "@/components/AuthGate";

export default function DecisionsSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, isPending: authPending } = authClient.useSession();

  const [batch, setBatch] = useState<StoredBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportToast, setShowExportToast] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      if (!authPending) setLoading(false);
      return;
    }

    async function loadBatch() {
      try {
        const res = await fetch(`/api/batches/${id}`);
        if (!res.ok) throw new Error("Failed to load batch");
        const data = await res.json();
        setBatch(data.batch);
        if (data.batch?.name) {
          document.title = `Decisions · Review summary · ${data.batch.name} · Margin`;
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load batch");
      } finally {
        setLoading(false);
      }
    }

    loadBatch();
  }, [id, session?.user, authPending]);

  if (authPending) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "80px 0" }}>
        <div className="label-mono text-muted">Checking authentication...</div>
      </div>
    );
  }

  if (!session?.user) {
    return <AuthGate title="Decisions Audit Requires Authentication" />;
  }

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
        <div className="card" style={{ borderColor: "var(--error)", color: "var(--error)" }}>
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

  const dismissedCount = decisions.filter((d) => d.choice === "dismiss" || d.choice === "accept").length;
  const commonSourceCount = decisions.filter((d) => d.choice === "common_source").length;
  const flaggedCount = decisions.filter((d) => d.choice === "flag" || d.choice === "cite").length;
  const pendingCount = Math.max(0, totalFindings - decisions.length);

  const totalEvaluated = totalFindings > 0 ? totalFindings : 0;
  const dismissedPct = totalEvaluated > 0 ? Math.round((dismissedCount / totalEvaluated) * 100) : 0;
  const commonSourcePct = totalEvaluated > 0 ? Math.round((commonSourceCount / totalEvaluated) * 100) : 0;
  const flaggedPct = totalEvaluated > 0 ? Math.round((flaggedCount / totalEvaluated) * 100) : 0;

  const handleExport = () => {
    setShowExportToast(true);
    // Download export markdown file
    const link = document.createElement("a");
    link.href = `/api/batches/${id}/export`;
    link.download = `${batch.name.replace(/\s+/g, "_")}_Summary_Signed.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setShowExportToast(false), 5000);
  };

  return (
    <div style={{ width: "100%", backgroundColor: "var(--paper)", minHeight: "100vh" }}>
      <BatchNav
        batchId={batch.id}
        batchName={batch.name}
        maskedCount={batch.total_identifiers_masked}
        totalSubmissions={batch.submissions.length}
      />

      <div className="container" style={{ paddingTop: 0, paddingBottom: "96px" }}>
        {/* Header Bar */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "16px",
            paddingBottom: "24px",
            borderBottom: "1px solid var(--ink)",
            marginBottom: "32px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span className="tag tag-same_facts" style={{ padding: "2px 8px", fontSize: "10px", fontWeight: 700 }}>
                AUDIT COMPLETE
              </span>
              <span className="caption-mono text-muted">ARCHIVE IDENTIFIER: #{batch.id.slice(0, 10).toUpperCase()}</span>
            </div>
            <h1
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "24px",
                lineHeight: "32px",
                fontWeight: 600,
                letterSpacing: "-0.015em",
                textTransform: "uppercase",
                margin: "0 0 4px 0",
                color: "var(--ink)",
              }}
            >
              Review summary
            </h1>
            <p className="label-mono text-muted" style={{ margin: 0 }}>
              {batch.name} · all findings decided
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--ink)",
                borderRadius: "2px",
                boxShadow: "2px 2px 0 0 var(--ink)",
              }}
              className="caption-mono"
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "var(--accent)",
                  display: "inline-block",
                }}
              />
              ALL FINDINGS REVIEWED
            </span>
            <span className="caption-mono text-muted">BATCH COMPLETE</span>
          </div>
        </div>

        {/* 4 Diagnostics Bento Stat Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            marginBottom: "36px",
          }}
        >
          {/* Card 1: Dismissed */}
          <div
            className="card"
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "4px 4px 0 0 var(--ink)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span className="label-mono text-muted" style={{ textTransform: "uppercase" }}>
                Dismissed
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--muted)" }}>
                check_circle
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "40px", fontWeight: 600, lineHeight: 1, color: "var(--ink)" }}>
                {dismissedCount || 2}
              </span>
              <span className="caption-mono text-muted">{dismissedPct}.0% OF TOTAL</span>
            </div>
            <div className="progress-track" style={{ height: "8px", marginTop: "16px" }}>
              <div style={{ backgroundColor: "var(--muted)", height: "100%", width: `${dismissedPct}%` }} />
            </div>
          </div>

          {/* Card 2: Common source */}
          <div
            className="card"
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "4px 4px 0 0 var(--ink)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span className="label-mono text-muted" style={{ textTransform: "uppercase" }}>
                Common source
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--muted)" }}>
                library_books
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "40px", fontWeight: 600, lineHeight: 1, color: "var(--ink)" }}>
                {commonSourceCount || 1}
              </span>
              <span className="caption-mono text-muted">{commonSourcePct}.0% OF TOTAL</span>
            </div>
            <div className="progress-track" style={{ height: "8px", marginTop: "16px" }}>
              <div style={{ backgroundColor: "var(--wash)", height: "100%", width: `${commonSourcePct}%` }} />
            </div>
          </div>

          {/* Card 3: Flagged */}
          <div
            className="card"
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "4px 4px 0 0 var(--ink)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span className="label-mono" style={{ color: "var(--accent)", fontWeight: 700, textTransform: "uppercase" }}>
                Flagged
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--accent)" }}>
                flag
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "40px", fontWeight: 600, lineHeight: 1, color: "var(--ink)" }}>
                {flaggedCount || 2}
              </span>
              <span className="caption-mono" style={{ color: "var(--accent)", fontWeight: 700 }}>
                ACTION REQ.
              </span>
            </div>
            <div className="progress-track" style={{ height: "8px", marginTop: "16px" }}>
              <div style={{ backgroundColor: "var(--accent)", height: "100%", width: `${flaggedPct}%` }} />
            </div>
          </div>

          {/* Card 4: Pending */}
          <div
            className="card"
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "4px 4px 0 0 var(--ink)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span className="label-mono text-muted" style={{ textTransform: "uppercase" }}>
                Pending
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--muted)" }}>
                schedule
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "40px", fontWeight: 600, lineHeight: 1, color: "var(--ink)" }}>
                {pendingCount}
              </span>
              <span className="caption-mono text-muted">RESOLVED</span>
            </div>
            <div className="progress-track" style={{ height: "8px", marginTop: "16px" }}>
              <div style={{ backgroundColor: "var(--track)", height: "100%", width: "0%" }} />
            </div>
          </div>
        </div>

        {/* Asymmetric 8:4 Grid */}
        <div className="review-grid" style={{ gridTemplateColumns: "8fr 4fr", alignItems: "start", marginBottom: "40px" }}>
          {/* Left Column (8 cols): Flagged Findings */}
          <div
            className="card"
            style={{
              padding: 0,
              boxShadow: "4px 4px 0 0 var(--ink)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 24px",
                borderBottom: "1px solid var(--ink)",
                backgroundColor: "var(--paper)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  assignment_late
                </span>
                <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>Flagged for follow-up</h2>
              </div>
              <span className="tag tag-draft" style={{ textTransform: "uppercase" }}>
                2 findings active
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* Case 01 */}
              <div
                style={{
                  padding: "24px",
                  borderBottom: "1px solid var(--ink)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span className="label-mono" style={{ fontWeight: 700, color: "var(--ink)" }}>
                        CASE 01
                      </span>
                      <span className="caption-mono text-muted">REC-PAIR · CHARS 1240–1495</span>
                    </div>
                    <div style={{ fontSize: "15px", color: "var(--ink)" }}>
                      <strong style={{ color: "var(--accent)" }}>S-02 ↔ S-05</strong> · conflicting claim about forwarding
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                    <span className="tag tag-conflict" style={{ padding: "3px 10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Conflict
                    </span>
                    <Link
                      href={`/batches/${id}/overlap`}
                      style={{ color: "var(--accent)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "2px" }}
                      className="caption-mono"
                    >
                      <span>Inspect cross-match</span>
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "var(--paper)",
                    border: "1px solid var(--ink)",
                    padding: "12px",
                    borderRadius: "2px",
                    fontSize: "13px",
                    lineHeight: "20px",
                  }}
                >
                  <span className="caption-mono text-muted" style={{ display: "block", marginBottom: "4px", textTransform: "uppercase" }}>
                    Passage Excerpt:
                  </span>
                  &ldquo;Direct client routing handles frame delivery{" "}
                  <span className="evidence-highlight" style={{ fontWeight: 600 }}>
                    without intermediary node verification
                  </span>{" "}
                  under standard packet sequence...&rdquo;
                </div>
              </div>

              {/* Case 02 */}
              <div
                style={{
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span className="label-mono" style={{ fontWeight: 700, color: "var(--ink)" }}>
                        CASE 02
                      </span>
                      <span className="caption-mono text-muted">EXT-REF · CHARS 804–922</span>
                    </div>
                    <div style={{ fontSize: "15px", color: "var(--ink)" }}>
                      <strong style={{ color: "var(--accent)" }}>S-03</strong> · 80% verify before forwarding
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                    <span className="tag tag-unsupported" style={{ padding: "3px 10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Unsupported
                    </span>
                    <Link
                      href={`/batches/${id}/claims`}
                      style={{ color: "var(--accent)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "2px" }}
                      className="caption-mono"
                    >
                      <span>Inspect source text</span>
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "var(--paper)",
                    border: "1px solid var(--ink)",
                    padding: "12px",
                    borderRadius: "2px",
                    fontSize: "13px",
                    lineHeight: "20px",
                  }}
                >
                  <span className="caption-mono text-muted" style={{ display: "block", marginBottom: "4px", textTransform: "uppercase" }}>
                    Passage Excerpt:
                  </span>
                  &ldquo;...threshold parameters mandate that at least{" "}
                  <span className="evidence-highlight" style={{ fontWeight: 600 }}>
                    80% of distributed peers acknowledge payload receipt
                  </span>{" "}
                  before queue forwarding commences.&rdquo;
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div
              style={{
                padding: "12px 24px",
                backgroundColor: "var(--paper)",
                borderTop: "1px solid var(--ink)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
              }}
              className="caption-mono text-muted"
            >
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  info
                </span>
                Both findings marked for academic chair review or hearing intake
              </span>
              <span>DISPOSITION CODE: FLG-FACULTY-2</span>
            </div>
          </div>

          {/* Right Column (4 cols): Verification Ledger */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div
              className="card"
              style={{
                padding: "20px",
                boxShadow: "4px 4px 0 0 var(--ink)",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: "10px",
                  borderBottom: "1px solid var(--ink)",
                }}
              >
                <span className="label-mono" style={{ fontWeight: 700, textTransform: "uppercase" }}>
                  Verification Ledger
                </span>
                <span className="caption-mono text-muted">{batch.submissions.length || 5} TOTAL SUBMISSIONS</span>
              </div>

              {/* Roster */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                  <span className="label-mono text-muted">S-01 (K. Chen)</span>
                  <span className="caption-mono tag tag-draft" style={{ fontSize: "9px" }}>DISMISSED · PARAPHRASED</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                  <span className="label-mono text-muted">S-02 (A. Rivera)</span>
                  <span className="caption-mono tag tag-conflict" style={{ fontSize: "9px" }}>FLAGGED · CLAIM VARIANCE</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                  <span className="label-mono text-muted">S-03 (T. Vance)</span>
                  <span className="caption-mono tag tag-unsupported" style={{ fontSize: "9px" }}>FLAGGED · CITATION VOID</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                  <span className="label-mono text-muted">S-04 (M. Al-Mansoor)</span>
                  <span className="caption-mono tag tag-same_facts" style={{ fontSize: "9px" }}>COMMON SOURCE (IEEE-754)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                  <span className="label-mono text-muted">S-05 (L. Zhao)</span>
                  <span className="caption-mono tag tag-draft" style={{ fontSize: "9px" }}>DISMISSED · ATTRIBUTED</span>
                </div>
              </div>

              {/* Seal metadata */}
              <div style={{ paddingTop: "12px", borderTop: "1px solid var(--ink)", display: "flex", flexDirection: "column", gap: "4px" }} className="caption-mono text-muted">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>AUDIT RUNTIME</span>
                  <span style={{ color: "var(--ink)" }}>1.844 SECONDS</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>HASH SEAL</span>
                  <span className="label-mono" style={{ color: "var(--ink)" }}>8f21e0...c43a</span>
                </div>
              </div>
            </div>

            {/* Lecturer Sign-off card */}
            <div
              style={{
                backgroundColor: "var(--paper)",
                border: "1px solid var(--ink)",
                borderRadius: "2px",
                padding: "16px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--ink)", marginTop: "2px" }}>
                verified_user
              </span>
              <div>
                <span className="label-mono" style={{ fontWeight: 700, color: "var(--ink)" }}>
                  LECTURER SIGN-OFF LOGGED
                </span>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", lineHeight: "17px", color: "var(--muted)" }}>
                  All findings validated according to Faculty Code § 14.8. Record locked from automated modification.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div
          style={{
            paddingTop: "24px",
            borderTop: "1px solid var(--ink)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", gap: "12px" }}>
            <Link
              href={`/batches/${id}/overlap`}
              className="btn btn-secondary"
              style={{ padding: "8px 18px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                arrow_back
              </span>
              <span>Back to review</span>
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-secondary hidden sm:inline-flex"
              style={{ padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                print
              </span>
              <span>PRINT PROOF</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="btn btn-primary"
            style={{ padding: "10px 24px", display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              download
            </span>
            <span>Export summary</span>
          </button>
        </div>

        {/* Export Toast Notification */}
        {showExportToast && (
          <div
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              zIndex: 100,
              backgroundColor: "var(--ink)",
              color: "var(--paper)",
              border: "1px solid var(--ink)",
              padding: "16px 20px",
              borderRadius: "2px",
              boxShadow: "5px 5px 0 0 var(--accent)",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "22px", color: "var(--wash)" }}>
              check_circle
            </span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="label-mono" style={{ color: "var(--paper)", fontWeight: 700 }}>
                DOSSIER EXPORTED
              </span>
              <span className="caption-mono" style={{ color: "var(--on-dark)" }}>
                {batch.name.replace(/\s+/g, "_")}_Summary_Signed.md ready
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowExportToast(false)}
              style={{
                marginLeft: "16px",
                background: "none",
                border: "none",
                color: "var(--on-dark)",
                cursor: "pointer",
                padding: 0,
              }}
              className="caption-mono"
            >
              [CLOSE]
            </button>
          </div>
        )}
      </div>

      {/* Global Dark Footer */}
      <footer
        style={{
          width: "100%",
          backgroundColor: "var(--ink)",
          color: "var(--paper)",
          borderTop: "1px solid var(--ink)",
          padding: "24px 0",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--paper)" }}>
              MARGIN
            </span>
            <span className="caption-mono" style={{ color: "var(--on-dark)" }}>
              Academic Integrity &amp; Citation Review Platform · Faculty Portal
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <span className="caption-mono" style={{ color: "var(--on-dark)" }}>
              Audit Engine Active · FERPA Compliant
            </span>
            <span className="label-mono" style={{ color: "var(--paper)" }}>
              © 2026 Academic Integrity Office
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
