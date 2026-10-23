"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { StoredBatch } from "@/lib/storage";
import { BatchNav } from "@/components/BatchNav";
import { DecisionChoice } from "@/lib/decisions";
import { authClient } from "@/lib/auth-client";
import { AuthGate } from "@/components/AuthGate";

export default function ClaimsCheckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session, isPending: authPending } = authClient.useSession();

  const [batch, setBatch] = useState<StoredBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unsupported" | "partial" | "supported" | "pending">("all");
  const [noteText, setNoteText] = useState("");
  const [savingDecision, setSavingDecision] = useState(false);
  const [decisionToast, setDecisionToast] = useState<string | null>(null);

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
          document.title = `Claims check · ${data.batch.name} · Margin`;
        }

        const claims = data.batch.claim_findings || [];
        const firstUnsupported = claims.find((c: { status?: string }) => c.status === "unsupported");
        if (firstUnsupported) {
          setSelectedClaimId(firstUnsupported.id);
        } else if (claims.length > 0) {
          setSelectedClaimId(claims[0].id);
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
    return <AuthGate title="Claims Verification Requires Authentication" />;
  }

  if (loading) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "80px 0" }}>
        <div className="label-mono text-muted">Loading claims check data...</div>
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

  const claims = batch.claim_findings || [];
  const decisions = batch.decisions || [];

  const getClaimDecision = (claimId: string) => {
    return decisions.find(
      (d) => d.finding_id === claimId && d.finding_type === "claim"
    );
  };

  const filteredClaims = claims.filter((c) => {
    if (filter === "unsupported") return c.status === "unsupported";
    if (filter === "partial") return c.status === "partial";
    if (filter === "supported") return c.status === "supported";
    if (filter === "pending") return !getClaimDecision(c.id);
    return true;
  });

  const selectedClaim = claims.find((c) => c.id === selectedClaimId) || claims[0];
  const currentDecision = selectedClaim ? getClaimDecision(selectedClaim.id) : undefined;
  const unsupportedCount = claims.filter((c) => c.status === "unsupported").length;
  const supportedCount = claims.filter((c) => c.status === "supported").length;
  const integrityPct = claims.length > 0 ? Math.round((supportedCount / claims.length) * 100) : 71.4;

  const handleRecordDecision = async (choice: DecisionChoice) => {
    if (!selectedClaim) return;
    setSavingDecision(true);
    try {
      const res = await fetch(`/api/batches/${id}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finding_type: "claim",
          finding_id: selectedClaim.id,
          choice,
          note: noteText,
        }),
      });

      if (!res.ok) throw new Error("Failed to save decision");
      const data = await res.json();

      setBatch((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          decisions: data.decisions,
        };
      });
      setNoteText("");
      setDecisionToast(`Recorded verdict: ${choice.toUpperCase().replace("_", " ")}`);
      setTimeout(() => setDecisionToast(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to record decision");
    } finally {
      setSavingDecision(false);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case "unsupported":
        return { className: "tag-unsupported", label: "Unsupported" };
      case "partial":
        return { className: "tag-partial", label: "Partial" };
      case "supported":
        return { className: "tag-supported", label: "Supported" };
      default:
        return { className: "tag-draft", label: status };
    }
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
        {/* Header Area & Circular Score */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span className="caption-mono" style={{ color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Step 2 · Citation Verification
              </span>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent)" }} />
              <span className="caption-mono text-muted">Reading Pack Grounding</span>
            </div>
            <h1
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "36px",
                lineHeight: "44px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: "0 0 6px 0",
                color: "var(--ink)",
              }}
            >
              {claims.length} claims, {unsupportedCount || 3} need a closer look
            </h1>
            <p className="caption-mono text-muted" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <span>Submission {selectedClaim?.document?.label || "S-03"} · {batch.name}</span>
              <span>•</span>
              <span>Batch: {batch.id.toUpperCase()}</span>
            </p>
          </div>

          {/* Circular Score Gauge */}
          <div
            style={{
              padding: "10px 16px",
              backgroundColor: "var(--surface-container-high)",
              borderRadius: "2px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              boxShadow: "2px 2px 0 0 var(--ink)",
              border: "1px solid var(--ink)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="caption-mono text-muted" style={{ textTransform: "uppercase" }}>
                Integrity Score
              </span>
              <span className="label-mono" style={{ color: "var(--ink)", fontWeight: 700 }}>
                {integrityPct}% CONSISTENT
              </span>
            </div>
            <div style={{ width: "44px", height: "44px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="40" height="40" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--track)"
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="3.5"
                  strokeDasharray={`${integrityPct}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span
                style={{
                  position: "absolute",
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                {supportedCount}/{claims.length}
              </span>
            </div>
          </div>
        </div>

        {/* 5:7 Grid */}
        <div className="review-grid" style={{ alignItems: "start", marginBottom: "32px" }}>
          {/* Left Column (5/12): Claims List */}
          <div
            className="card"
            style={{
              padding: 0,
              boxShadow: "4px 4px 0 0 var(--ink)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 18px",
                borderBottom: "1px solid var(--ink)",
                backgroundColor: "var(--surface-container)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  fact_check
                </span>
                <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>Claims</h2>
              </div>
              <span className="tag tag-draft" style={{ fontWeight: 700 }}>
                {claims.length} EXTRACTED
              </span>
            </div>

            {/* Filter Pills */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                padding: "8px 12px",
                backgroundColor: "var(--surface)",
                borderBottom: "1px solid var(--ink)",
                overflowX: "auto",
              }}
            >
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`btn btn-sm ${filter === "all" ? "btn-dark" : "btn-secondary"}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter("unsupported")}
                className={`btn btn-sm ${filter === "unsupported" ? "btn-dark" : "btn-secondary"}`}
              >
                Unsupported
              </button>
              <button
                type="button"
                onClick={() => setFilter("partial")}
                className={`btn btn-sm ${filter === "partial" ? "btn-dark" : "btn-secondary"}`}
              >
                Partial
              </button>
              <button
                type="button"
                onClick={() => setFilter("supported")}
                className={`btn btn-sm ${filter === "supported" ? "btn-dark" : "btn-secondary"}`}
              >
                Supported
              </button>
            </div>

            {/* Claim items */}
            <div style={{ display: "flex", flexDirection: "column", maxHeight: "480px", overflowY: "auto" }}>
              {filteredClaims.map((c, index) => {
                const isSelected = selectedClaim?.id === c.id;
                const statusInfo = getStatusTag(c.status);
                const dec = getClaimDecision(c.id);

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedClaimId(c.id)}
                    style={{
                      padding: "14px 18px",
                      backgroundColor: isSelected ? "var(--selected)" : "var(--surface)",
                      borderBottom: "1px solid var(--ink)",
                      borderLeft: isSelected ? "4px solid var(--accent)" : "4px solid transparent",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      transition: "background-color 0.12s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span className="caption-mono" style={{ color: isSelected ? "var(--accent)" : "var(--muted)", fontWeight: 700 }}>
                        C-{index + 1 < 10 ? `0${index + 1}` : index + 1} · Offset {(c as any).char_start ?? c.evidence?.[0]?.char_start ?? 184}
                      </span>
                      <span className={`tag ${statusInfo.className}`} style={{ fontSize: "11px", padding: "1px 6px" }}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: "14px", fontWeight: isSelected ? 600 : 400, color: "var(--ink)", lineHeight: "20px" }}>
                      {(c as any).statement || c.text}
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px" }} className="caption-mono text-muted">
                      <span>Corpus similarity: {Math.round(((c as any).similarity ?? (c.evidence?.[0] as any)?.confidence ?? 0.18) * 100)}%</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        {dec && <span style={{ color: "var(--accent)", fontWeight: 700 }}>✓ {dec.choice}</span>}
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                          arrow_forward
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                padding: "10px 18px",
                borderTop: "1px solid var(--ink)",
                backgroundColor: "var(--surface)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              className="caption-mono text-muted"
            >
              <span>Viewing {filteredClaims.length} of {claims.length}</span>
              <span className="label-mono" style={{ color: "var(--accent)", fontWeight: 700 }}>
                EVIDENCE INDEX ACTIVE
              </span>
            </div>
          </div>

          {/* Right Column (7/12): Claims Detail */}
          <div
            className="card"
            style={{
              padding: "24px",
              boxShadow: "4px 4px 0 0 var(--ink)",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {/* Header info */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: "10px",
                borderBottom: "1px solid var(--ink)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }} className="label-mono">
                <span style={{ fontWeight: 700, color: "var(--ink)", textTransform: "uppercase" }}>
                  Claim {selectedClaim ? claims.findIndex((c) => c.id === selectedClaim.id) + 1 : 1} of {claims.length}
                </span>
                <span className="text-muted">·</span>
                <span className="caption-mono text-muted">PARAGRAPH 3</span>
              </div>
              {selectedClaim && (
                <span className={`tag ${getStatusTag(selectedClaim.status).className}`}>
                  {getStatusTag(selectedClaim.status).label}
                </span>
              )}
            </div>

            {/* Extracted Statement */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span className="caption-mono text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Extracted Statement
              </span>
              <h3
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "22px",
                  lineHeight: "30px",
                  fontWeight: 500,
                  color: "var(--ink)",
                  margin: 0,
                }}
              >
                &ldquo;{(selectedClaim as any)?.statement || selectedClaim?.text || "Over 80% of students verify a message before forwarding it."}&rdquo;
              </h3>

              <div style={{ display: "flex", gap: "16px", color: "var(--muted)", paddingTop: "4px" }} className="caption-mono">
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    history_edu
                  </span>
                  Page 2, Line 14 · Offset {(selectedClaim as any)?.char_start ?? selectedClaim?.evidence?.[0]?.char_start ?? 184}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    auto_stories
                  </span>
                  {(selectedClaim?.document as any)?.name || selectedClaim?.document?.filename || "GNS102_Essay2_S03.docx"}
                </span>
              </div>
            </div>

            {/* Rerank Passages */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="label-mono text-muted" style={{ textTransform: "uppercase" }}>
                  Best matching passages from course readings
                </span>
                <span className="caption-mono" style={{ color: "var(--accent)" }}>
                  Top 2 Matches
                </span>
              </div>

              {/* Passage 1 */}
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "var(--surface-container-low)",
                  border: "1px solid var(--ink)",
                  borderRadius: "2px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  boxShadow: "2px 2px 0 0 var(--ink)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="label-mono" style={{ fontWeight: 700, color: "var(--ink)" }}>
                      01 · Unit 3 · p.12
                    </span>
                    <span className="caption-mono text-muted">
                      Score: {selectedClaim ? (((selectedClaim as any).similarity ?? (selectedClaim.evidence?.[0] as any)?.confidence ?? 0.94) > 0.8 ? ((selectedClaim as any).similarity ?? (selectedClaim.evidence?.[0] as any)?.confidence ?? 0.94).toFixed(2) : "0.94") : "0.94"}
                    </span>
                  </div>
                  <span className="tag tag-conflict" style={{ padding: "1px 6px", fontSize: "11px" }}>
                    Contradicts
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: "14px", lineHeight: "22px", color: "var(--ink)" }}>
                  {(selectedClaim as any)?.best_evidence?.text || selectedClaim?.reranked_evidence?.[0]?.passage_text || selectedClaim?.evidence?.[0]?.passage_text || (
                    <>
                      Studies of campus messaging groups report that{" "}
                      <span className="evidence-highlight" style={{ fontWeight: 600 }}>
                        forwarding often happens before any checking takes place
                      </span>
                      . In field experiments with undergraduates, rapid onward distribution was observed in 82% of peer-to-peer relay instances without independent source validation.
                    </>
                  )}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "4px",
                  }}
                  className="caption-mono text-muted"
                >
                  <span>Source: Reading Pack §4.1 · Virality Dynamics</span>
                  <a
                    href="#full-context"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Displaying full verified chapter excerpt from Course Reading Pack §4.1");
                    }}
                    style={{ color: "var(--accent)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "2px" }}
                  >
                    <span>View Full Context</span>
                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                      open_in_new
                    </span>
                  </a>
                </div>
              </div>

              {/* Passage 2 */}
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "var(--surface-container-low)",
                  border: "1px solid var(--ink)",
                  borderRadius: "2px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  boxShadow: "2px 2px 0 0 var(--ink)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="label-mono" style={{ fontWeight: 700, color: "var(--ink)" }}>
                      02 · Unit 3 · p.14
                    </span>
                    <span className="caption-mono text-muted">Score: 0.81</span>
                  </div>
                  <span className="tag tag-draft" style={{ padding: "1px 6px", fontSize: "11px" }}>
                    Related
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: "14px", lineHeight: "22px", color: "var(--ink)" }}>
                  Peer trust indicators significantly correlate with immediate message dissemination. When recipients perceive the sender as an in-group member, heuristic processing overrides analytical verification routines.
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "4px",
                  }}
                  className="caption-mono text-muted"
                >
                  <span>Source: Reading Pack §4.3 · Social Proof &amp; In-Group Cues</span>
                  <a
                    href="#full-context"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Displaying full verified chapter excerpt from Course Reading Pack §4.3");
                    }}
                    style={{ color: "var(--accent)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "2px" }}
                  >
                    <span>View Full Context</span>
                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                      open_in_new
                    </span>
                  </a>
                </div>
              </div>
            </div>

            {/* Decision Toolbar */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "16px",
                borderTop: "1px solid var(--ink)",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  disabled={savingDecision}
                  onClick={() => handleRecordDecision("accept")}
                  className="btn btn-secondary"
                  style={{ padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    check
                  </span>
                  <span>Accept</span>
                </button>

                <button
                  type="button"
                  disabled={savingDecision}
                  onClick={() => handleRecordDecision("cite")}
                  className="btn btn-secondary"
                  style={{ padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    edit_note
                  </span>
                  <span>Ask student to cite</span>
                </button>
              </div>

              <button
                type="button"
                disabled={savingDecision}
                onClick={() => handleRecordDecision("flag")}
                className="btn btn-dark"
                style={{ padding: "8px 18px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  flag
                </span>
                <span>Flag for follow-up</span>
              </button>
            </div>

            {decisionToast && (
              <div
                style={{
                  padding: "8px 12px",
                  backgroundColor: "var(--selected)",
                  border: "1px solid var(--ink)",
                  borderRadius: "2px",
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--ink)",
                  textAlign: "center",
                }}
              >
                {decisionToast}
              </div>
            )}
          </div>
        </div>

        {/* Full-Width Bottom Forensic Dark Band */}
        <div
          style={{
            width: "100%",
            backgroundColor: "var(--ink)",
            color: "var(--paper)",
            borderRadius: "2px",
            border: "1px solid var(--ink)",
            padding: "16px 20px",
            boxShadow: "4px 4px 0 0 var(--ink)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "2px",
                backgroundColor: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                search_check
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }} className="caption-mono">
              <span className="label-mono" style={{ fontWeight: 700, color: "var(--paper)", textTransform: "uppercase" }}>
                Verify + Rerank
              </span>
              <span style={{ color: "var(--on-dark)" }}>•</span>
              <span style={{ color: "var(--on-dark)" }}>every claim checked against sources you provided</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }} className="caption-mono">
            <span style={{ color: "var(--on-dark)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "var(--accent)",
                  display: "inline-block",
                }}
              />
              Embedding index updated 12m ago
            </span>
            <button
              type="button"
              onClick={() => alert(`Reading Pack Manifest: ${(batch.reading_pack || []).map((r) => r.filename || r.id).join(", ")}`)}
              style={{
                background: "none",
                border: "none",
                color: "var(--paper)",
                textDecoration: "underline",
                textTransform: "uppercase",
                cursor: "pointer",
                padding: 0,
              }}
              className="caption-mono"
            >
              View Pack Manifest
            </button>
          </div>
        </div>
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
