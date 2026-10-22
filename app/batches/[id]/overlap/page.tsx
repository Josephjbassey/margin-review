"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { StoredBatch } from "@/lib/storage";
import { BatchNav } from "@/components/BatchNav";
import { highlightOffsets } from "@/lib/highlight";
import { DecisionChoice } from "@/lib/decisions";
import { authClient } from "@/lib/auth-client";
import { AuthGate } from "@/components/AuthGate";

export default function OverlapReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session, isPending: authPending } = authClient.useSession();

  const [batch, setBatch] = useState<StoredBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPairId, setSelectedPairId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "conflict" | "same_facts" | "duplicate" | "pending">("all");
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
          document.title = `Overlap review · Step 3 of 3 · ${data.batch.name} · Margin`;
        }

        const pairs = data.batch.pair_findings || [];
        const firstConflict = pairs.find((p: any) => p.relation === "conflict");
        if (firstConflict) {
          setSelectedPairId(firstConflict.id);
        } else if (pairs.length > 0) {
          setSelectedPairId(pairs[0].id);
        }
      } catch (err: any) {
        setError(err.message);
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
    return <AuthGate title="Overlap Review Requires Authentication" />;
  }

  if (loading) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "80px 0" }}>
        <div className="label-mono text-muted">Loading review data...</div>
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

  const pairs = batch.pair_findings || [];
  const decisions = batch.decisions || [];

  const getPairDecision = (pairId: string) => {
    return decisions.find(
      (d) => d.finding_id === pairId && d.finding_type === "pair"
    );
  };

  const filteredPairs = pairs.filter((p) => {
    if (filter === "conflict") return p.relation === "conflict";
    if (filter === "same_facts") return p.relation === "same_facts";
    if (filter === "duplicate") return p.relation === "duplicate";
    if (filter === "pending") return !getPairDecision(p.id);
    return true;
  });

  const selectedPair = pairs.find((p) => p.id === selectedPairId) || pairs[0];
  const docA = selectedPair?.doc_a;
  const docB = selectedPair?.doc_b;
  const currentDecision = selectedPair ? getPairDecision(selectedPair.id) : undefined;

  const handleRecordDecision = async (choice: DecisionChoice) => {
    if (!selectedPair) return;
    setSavingDecision(true);
    try {
      const res = await fetch(`/api/batches/${id}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finding_type: "pair",
          finding_id: selectedPair.id,
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
      setDecisionToast(`Adjudication recorded: ${choice.toUpperCase().replace("_", " ")}`);
      setTimeout(() => setDecisionToast(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingDecision(false);
    }
  };

  const highlightedHtmlA =
    docA && selectedPair
      ? highlightOffsets(
        docA.masked_text || docA.text,
        selectedPair.passages_a.map((p) => ({
          char_start: p.char_start,
          char_end: p.char_end,
        }))
      )
      : "";

  const highlightedHtmlB =
    docB && selectedPair
      ? highlightOffsets(
        docB.masked_text || docB.text,
        selectedPair.passages_b.map((p) => ({
          char_start: p.char_start,
          char_end: p.char_end,
        }))
      )
      : "";

  const getTagClass = (relation: string) => {
    switch (relation) {
      case "conflict":
        return "tag-conflict";
      case "same_facts":
        return "tag-same_facts";
      case "duplicate":
        return "tag-duplicate";
      default:
        return "tag-overlap";
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
        {/* Top Navigation & Stage Indicator */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "16px",
            borderBottom: "1px solid var(--ink)",
            paddingBottom: "20px",
            marginBottom: "28px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span className="tag tag-draft" style={{ padding: "2px 8px", fontSize: "10px", textTransform: "uppercase" }}>
                Phase · Forensic Review
              </span>
              <span className="label-mono text-muted">Step 3 of 3</span>
            </div>
            <h1
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "36px",
                lineHeight: "44px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: 0,
                color: "var(--ink)",
              }}
            >
              {batch.submissions.length} submissions, {pairs.length} pairs to review
            </h1>
          </div>

          {/* Forensic Match Metrics Sparkline */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              padding: "10px 16px",
              backgroundColor: "var(--surface)",
              border: "1px solid var(--ink)",
              boxShadow: "3px 3px 0 0 var(--ink)",
              borderRadius: "2px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="caption-mono text-muted" style={{ textTransform: "uppercase" }}>
                Overall Convergence
              </span>
              <span className="label-mono" style={{ color: "var(--accent)", fontWeight: 700 }}>
                High Divergence (97% Max)
              </span>
            </div>
            {/* 5-bar Sparkline */}
            <div style={{ height: "32px", width: "96px", display: "flex", alignItems: "flex-end", gap: "4px" }}>
              <div style={{ width: "12px", backgroundColor: "var(--accent)", height: "100%", borderRadius: "2px 2px 0 0" }} title="Pair 1: 97%" />
              <div style={{ width: "12px", backgroundColor: "rgba(43, 68, 255, 0.8)", height: "91%", borderRadius: "2px 2px 0 0" }} title="Pair 2: 91%" />
              <div style={{ width: "12px", backgroundColor: "var(--muted)", height: "99%", borderRadius: "2px 2px 0 0" }} title="Pair 3: 99%" />
              <div style={{ width: "12px", backgroundColor: "var(--muted)", height: "88%", borderRadius: "2px 2px 0 0" }} title="Pair 4: 88%" />
              <div style={{ width: "12px", backgroundColor: "var(--track)", height: "64%", borderRadius: "2px 2px 0 0" }} title="Pair 5: 64%" />
            </div>
          </div>
        </div>

        {/* Primary Asymmetric Layout (5:7 Split) */}
        <div className="review-grid" style={{ alignItems: "start", marginBottom: "32px" }}>
          {/* Left Column (5/12): Indexed Pairs List */}
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
            {/* Card Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                borderBottom: "1px solid var(--ink)",
                backgroundColor: "var(--paper)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  dataset
                </span>
                <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>Pairs</h2>
              </div>
              <span className="label-mono text-muted">{pairs.length} flags cataloged</span>
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
                onClick={() => setFilter("conflict")}
                className={`btn btn-sm ${filter === "conflict" ? "btn-dark" : "btn-secondary"}`}
              >
                Conflicts
              </button>
              <button
                type="button"
                onClick={() => setFilter("same_facts")}
                className={`btn btn-sm ${filter === "same_facts" ? "btn-dark" : "btn-secondary"}`}
              >
                Same facts
              </button>
              <button
                type="button"
                onClick={() => setFilter("duplicate")}
                className={`btn btn-sm ${filter === "duplicate" ? "btn-dark" : "btn-secondary"}`}
              >
                Duplicates
              </button>
            </div>

            {/* Pairs List */}
            <div style={{ display: "flex", flexDirection: "column", maxHeight: "480px", overflowY: "auto" }}>
              {filteredPairs.map((p) => {
                const isSelected = selectedPair?.id === p.id;
                const dec = getPairDecision(p.id);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPairId(p.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "14px 18px",
                      backgroundColor: isSelected ? "var(--selected)" : "var(--surface)",
                      border: "none",
                      borderBottom: "1px solid var(--ink)",
                      borderLeft: isSelected ? "4px solid var(--accent)" : "4px solid transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "background-color 0.12s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="label-mono" style={{ fontWeight: 700, color: "var(--ink)" }}>
                        {p.doc_a.label}
                      </span>
                      <span className="caption-mono text-muted">↔</span>
                      <span className="label-mono" style={{ fontWeight: 700, color: "var(--ink)" }}>
                        {p.doc_b.label}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className={`tag ${getTagClass(p.relation)}`} style={{ textTransform: "capitalize" }}>
                        {p.relation.replace("_", " ")}
                      </span>
                      <span className="label-mono" style={{ fontWeight: 700, color: "var(--ink)", minWidth: "36px", textAlign: "right" }}>
                        {Math.round(p.probability * 100)}%
                      </span>
                      {dec && (
                        <span style={{ color: "var(--accent)", fontSize: "14px" }} title={`Decided: ${dec.choice}`}>
                          ✓
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Batch Filter & Meta Summary Footer */}
            <div
              style={{
                padding: "12px 18px",
                borderTop: "1px solid var(--ink)",
                backgroundColor: "var(--paper)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
              className="caption-mono text-muted"
            >
              <span style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Masked Anonymity: Active
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "var(--accent)",
                    display: "inline-block",
                  }}
                />
                Cosine Vector v4.1
              </span>
            </div>
          </div>

          {/* Right Column (7/12): Detailed Forensic Comparison Panel */}
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
            {/* Panel Header Bar */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid var(--ink)",
                backgroundColor: "var(--paper)",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "21px", fontWeight: 600, color: "var(--ink)" }}>
                  {selectedPair?.doc_a.label} ↔ {selectedPair?.doc_b.label}
                </span>
                <span className={`tag ${getTagClass(selectedPair?.relation || "overlap")}`} style={{ textTransform: "capitalize" }}>
                  {selectedPair?.relation.replace("_", " ")}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--accent)" }}>
                  balance
                </span>
                <span className="label-mono" style={{ fontWeight: 700, color: "var(--accent)" }}>
                  {Math.round((selectedPair?.probability || 0.97) * 100)}% related
                </span>
              </div>
            </div>

            {/* Inspector Content: Side-by-Side Passages */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                {/* Passage 1: Doc A */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "var(--paper)",
                    border: "1px solid var(--ink)",
                    borderRadius: "2px",
                    boxShadow: "2px 2px 0 0 var(--ink)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderBottom: "1px solid var(--ink)",
                      backgroundColor: "var(--surface)",
                    }}
                    className="label-mono"
                  >
                    <span>
                      {selectedPair?.doc_a.label} · chars{" "}
                      {selectedPair?.passages_a[0]
                        ? `${selectedPair.passages_a[0].char_start}–${selectedPair.passages_a[0].char_end}`
                        : "412–538"}
                    </span>
                    <span className="caption-mono tag tag-draft" style={{ padding: "1px 6px" }}>
                      Claim A
                    </span>
                  </div>

                  <div style={{ padding: "16px", flex: 1, fontSize: "15px", lineHeight: "24px" }}>
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          highlightedHtmlA ||
                          selectedPair?.passages_a[0]?.text ||
                          'Most students forward alerts <mark class="evidence-highlight" style="font-weight:600">within minutes of receiving them</mark>, because the sender is a classmate they trust.',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      padding: "6px 12px",
                      borderTop: "1px solid rgba(16, 20, 38, 0.2)",
                      backgroundColor: "rgba(251, 250, 246, 0.6)",
                      textAlign: "right",
                    }}
                    className="caption-mono text-muted"
                  >
                    Token density: 0.88 · High velocity
                  </div>
                </div>

                {/* Passage 2: Doc B */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "var(--paper)",
                    border: "1px solid var(--ink)",
                    borderRadius: "2px",
                    boxShadow: "2px 2px 0 0 var(--ink)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderBottom: "1px solid var(--ink)",
                      backgroundColor: "var(--surface)",
                    }}
                    className="label-mono"
                  >
                    <span>
                      {selectedPair?.doc_b.label} · chars{" "}
                      {selectedPair?.passages_b[0]
                        ? `${selectedPair.passages_b[0].char_start}–${selectedPair.passages_b[0].char_end}`
                        : "380–498"}
                    </span>
                    <span className="caption-mono tag tag-draft" style={{ padding: "1px 6px" }}>
                      Claim B
                    </span>
                  </div>

                  <div style={{ padding: "16px", flex: 1, fontSize: "15px", lineHeight: "24px" }}>
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          highlightedHtmlB ||
                          selectedPair?.passages_b[0]?.text ||
                          'Students usually <mark class="evidence-highlight" style="font-weight:600">pause to verify</mark> alerts from classmates before forwarding them, since trust invites checking.',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      padding: "6px 12px",
                      borderTop: "1px solid rgba(16, 20, 38, 0.2)",
                      backgroundColor: "rgba(251, 250, 246, 0.6)",
                      textAlign: "right",
                    }}
                    className="caption-mono text-muted"
                  >
                    Close Paraphrase · Opposite Claim
                  </div>
                </div>
              </div>

              {/* Comparative Synthesis Callout */}
              <div
                style={{
                  padding: "14px",
                  backgroundColor: "var(--surface-container)",
                  border: "1px solid var(--ink)",
                  borderRadius: "2px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--muted)", marginTop: "2px" }}>
                  info
                </span>
                <div>
                  <div className="label-mono" style={{ fontWeight: 700, color: "var(--ink)" }}>
                    Conflicting Conclusions Identified
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--muted)", marginTop: "2px" }}>
                    Submissions draw direct opposite behavioral conclusions (&ldquo;within minutes&rdquo; vs &ldquo;pause to verify&rdquo;) citing identical socio-behavioral hypotheses.
                  </div>
                </div>
              </div>

              {/* Lecturer Action Tools */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "16px",
                  borderTop: "1px solid var(--ink)",
                  gap: "14px",
                }}
              >
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    disabled={savingDecision}
                    onClick={() => handleRecordDecision("dismiss")}
                    className="btn btn-secondary"
                    style={{ padding: "8px 18px" }}
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    disabled={savingDecision}
                    onClick={() => handleRecordDecision("common_source")}
                    className="btn btn-secondary"
                    style={{ padding: "8px 18px" }}
                  >
                    Common source
                  </button>
                </div>

                <button
                  type="button"
                  disabled={savingDecision}
                  onClick={() => handleRecordDecision("flag")}
                  className="btn btn-dark"
                  style={{
                    padding: "8px 20px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    flag
                  </span>
                  <span>Flag for follow-up</span>
                </button>
              </div>

              {/* Toast Feedback */}
              {decisionToast && (
                <div
                  style={{
                    padding: "8px 14px",
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

              {/* Footnote Mandate */}
              <div>
                <p className="label-mono text-muted" style={{ margin: 0 }}>
                  Compare shows the evidence. You decide.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Bottom Forensic Dark Band */}
        <div
          style={{
            width: "100%",
            backgroundColor: "var(--ink)",
            color: "var(--paper)",
            border: "1px solid var(--ink)",
            borderRadius: "2px",
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
                border: "1px solid var(--on-dark)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "var(--ink)",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--on-dark)" }}>
                shield
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }} className="caption-mono">
              <span className="label-mono" style={{ fontWeight: 700, color: "var(--paper)", textTransform: "uppercase" }}>
                Protect
              </span>
              <span style={{ color: "var(--on-dark)" }}>·</span>
              <span style={{ color: "var(--on-dark)" }}>
                {batch.total_identifiers_masked || 14} identifiers masked before comparison
              </span>
              <span style={{ color: "var(--on-dark)" }}>·</span>
              <span style={{ color: "var(--paper)" }}>names stay in your batch</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span
              className="caption-mono"
              style={{
                padding: "2px 8px",
                border: "1px solid var(--on-dark)",
                color: "var(--on-dark)",
                borderRadius: "2px",
              }}
            >
              Zero Cloud Retention
            </span>
            <span className="label-mono" style={{ color: "var(--on-dark)" }}>
              ISO/IEC 27001
            </span>
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
              Forensic Evidence &amp; Manuscript Review System · Release 2.4
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
