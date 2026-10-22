"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { StoredBatch } from "@/lib/storage";
import { BatchNav } from "@/components/BatchNav";
import { FooterBand } from "@/components/FooterBand";
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
          document.title = `Overlap Review · ${data.batch.name} · Margin`;
        }

        // Select the first conflict or first pair by default
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
        <div className="card" style={{ borderColor: "#900", color: "#900" }}>
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
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingDecision(false);
    }
  };

  // Generate highlighted HTML
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
    <div>
      <BatchNav
        batchId={batch.id}
        batchName={batch.name}
        maskedCount={batch.total_identifiers_masked}
        totalSubmissions={batch.submissions.length}
      />

      <div className="container" style={{ paddingTop: 0, paddingBottom: 120 }}>
        {/* System notice */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 14px",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--ink)",
            borderRadius: 2,
            marginBottom: 20,
          }}
        >
          <div className="caption-mono text-muted">
            <strong style={{ color: "var(--ink)" }}>REVIEW POLICY:</strong> Margin flags pairwise alignment
            and conflicts for lecturer determination. It does not issue a verdict.
          </div>
          <div className="caption-mono text-muted">
            {pairs.length} pairs evaluated · {decisions.length} decided
          </div>
        </div>

        {pairs.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: "center" }}>
            <p className="text-muted" style={{ margin: "0 0 16px 0" }}>
              No pairwise overlap detected across submissions.
            </p>
            <Link href={`/batches/${id}/claims`} className="btn btn-primary">
              Proceed to Claims Check →
            </Link>
          </div>
        ) : (
          <div className="review-grid">
            {/* Left Column (5/12): Pairs List */}
            <div>
              {/* Filter Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  marginBottom: 12,
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => setFilter("all")}
                  className={`btn btn-sm ${filter === "all" ? "btn-dark" : "btn-secondary"}`}
                >
                  All ({pairs.length})
                </button>
                <button
                  onClick={() => setFilter("conflict")}
                  className={`btn btn-sm ${filter === "conflict" ? "btn-dark" : "btn-secondary"}`}
                >
                  Conflicts
                </button>
                <button
                  onClick={() => setFilter("same_facts")}
                  className={`btn btn-sm ${filter === "same_facts" ? "btn-dark" : "btn-secondary"}`}
                >
                  Same Facts
                </button>
                <button
                  onClick={() => setFilter("duplicate")}
                  className={`btn btn-sm ${filter === "duplicate" ? "btn-dark" : "btn-secondary"}`}
                >
                  Duplicates
                </button>
                <button
                  onClick={() => setFilter("pending")}
                  className={`btn btn-sm ${filter === "pending" ? "btn-dark" : "btn-secondary"}`}
                >
                  Pending
                </button>
              </div>

              {/* List */}
              <div
                className="card"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  maxHeight: "calc(100vh - 240px)",
                  overflowY: "auto",
                }}
              >
                {filteredPairs.map((p) => {
                  const isSelected = selectedPair?.id === p.id;
                  const dec = getPairDecision(p.id);

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPairId(p.id)}
                      className={`list-row ${isSelected ? "selected" : ""}`}
                      style={{
                        padding: "14px 16px",
                        cursor: "pointer",
                        borderLeft: isSelected ? "4px solid var(--accent)" : "4px solid transparent",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span className={`tag ${getTagClass(p.relation)}`} style={{ textTransform: "uppercase" }}>
                            {p.relation.replace("_", " ")}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>
                            {p.doc_a.label} ↔ {p.doc_b.label}
                          </span>
                        </div>
                        <div className="caption-mono text-muted">
                          Probability: {Math.round(p.probability * 100)}% ·{" "}
                          {p.passages_a.length} passage{p.passages_a.length === 1 ? "" : "s"}
                        </div>
                      </div>

                      <div>
                        {dec ? (
                          <span
                            className="tag tag-same_facts"
                            style={{ fontSize: 11, padding: "2px 6px" }}
                          >
                            ✓ {dec.choice.replace("_", " ")}
                          </span>
                        ) : (
                          <span
                            className="caption-mono tag tag-draft"
                            style={{ fontSize: 10, padding: "2px 6px" }}
                          >
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column (7/12): Side-by-Side Manuscripts */}
            <div>
              {selectedPair ? (
                <div>
                  {/* Pair Header Card */}
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <span className={`tag ${getTagClass(selectedPair.relation)}`} style={{ fontWeight: 700 }}>
                            {selectedPair.relation.toUpperCase().replace("_", " ")}
                          </span>
                          <span style={{ fontSize: 18, fontWeight: 700 }}>
                            {selectedPair.doc_a.label} vs {selectedPair.doc_b.label}
                          </span>
                        </div>
                        <p className="caption-mono text-muted" style={{ margin: 0 }}>
                          Pair ID: {selectedPair.id} · Model Alignment Probability:{" "}
                          <strong>{Math.round(selectedPair.probability * 100)}%</strong>
                        </p>
                      </div>

                      {currentDecision && (
                        <div
                          className="tag tag-same_facts"
                          style={{ fontWeight: 700, fontSize: 12, padding: "4px 10px" }}
                        >
                          Decided: {currentDecision.choice.toUpperCase().replace("_", " ")}
                        </div>
                      )}
                    </div>

                    {/* Decision Action Toolbar */}
                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: "1px solid rgba(16,20,38,0.15)",
                        backgroundColor: "var(--paper)",
                        padding: 12,
                        borderRadius: 2,
                      }}
                    >
                      <div className="caption-mono text-muted" style={{ fontWeight: 700, marginBottom: 8 }}>
                        RECORD LECTURER DETERMINATION:
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                        <button
                          type="button"
                          disabled={savingDecision}
                          onClick={() => handleRecordDecision("dismiss")}
                          className={`btn btn-sm ${currentDecision?.choice === "dismiss" ? "btn-dark" : "btn-secondary"}`}
                        >
                          Dismiss (Unrelated)
                        </button>
                        <button
                          type="button"
                          disabled={savingDecision}
                          onClick={() => handleRecordDecision("common_source")}
                          className={`btn btn-sm ${currentDecision?.choice === "common_source" ? "btn-dark" : "btn-secondary"}`}
                        >
                          Common Source / Template
                        </button>
                        <button
                          type="button"
                          disabled={savingDecision}
                          onClick={() => handleRecordDecision("flag")}
                          className={`btn btn-sm ${currentDecision?.choice === "flag" ? "btn-dark" : "btn-secondary"}`}
                        >
                          🚩 Flag for Follow-up
                        </button>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="text"
                          className="input"
                          style={{ fontSize: 13, padding: "6px 10px" }}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder={currentDecision?.note ? `Current note: "${currentDecision.note}"` : "Add lecturer note or investigation prompt..."}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Side-by-Side Manuscripts View */}
                  <div className="manuscripts-grid">
                    {/* Manuscript A */}

                    <div className="card" style={{ padding: 16 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingBottom: 8,
                          marginBottom: 12,
                          borderBottom: "1px solid rgba(16,20,38,0.15)",
                        }}
                      >
                        <div>
                          <span className="caption-mono tag tag-draft" style={{ marginRight: 6 }}>
                            {docA?.label}
                          </span>
                          <strong style={{ fontSize: 13 }}>{docA?.filename}</strong>
                        </div>
                        <span className="caption-mono text-muted">Masked Text</span>
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                          maxHeight: "520px",
                          overflowY: "auto",
                          backgroundColor: "var(--paper)",
                          padding: 12,
                          border: "1px solid rgba(16,20,38,0.15)",
                          fontFamily: "var(--font-inter)",
                        }}
                        dangerouslySetInnerHTML={{ __html: highlightedHtmlA }}
                      />
                    </div>

                    {/* Manuscript B */}
                    <div className="card" style={{ padding: 16 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingBottom: 8,
                          marginBottom: 12,
                          borderBottom: "1px solid rgba(16,20,38,0.15)",
                        }}
                      >
                        <div>
                          <span className="caption-mono tag tag-draft" style={{ marginRight: 6 }}>
                            {docB?.label}
                          </span>
                          <strong style={{ fontSize: 13 }}>{docB?.filename}</strong>
                        </div>
                        <span className="caption-mono text-muted">Masked Text</span>
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                          maxHeight: "520px",
                          overflowY: "auto",
                          backgroundColor: "var(--paper)",
                          padding: 12,
                          border: "1px solid rgba(16,20,38,0.15)",
                          fontFamily: "var(--font-inter)",
                        }}
                        dangerouslySetInnerHTML={{ __html: highlightedHtmlB }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding: 40, textAlign: "center" }}>
                  Select a pair from the left column to inspect evidence.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <FooterBand
        note={`Protect · ${batch.total_identifiers_masked} student identifiers masked before comparison`}
        metric="FERPA Isolation Active"
      />
    </div>
  );
}
