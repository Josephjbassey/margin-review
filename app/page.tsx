"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StoredBatch } from "@/lib/storage";

export default function BatchesPage() {
  const [batches, setBatches] = useState<StoredBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [filter, setFilter] = useState<"all" | "done" | "running">("all");

  const loadBatches = async () => {
    try {
      const res = await fetch("/api/batches");
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
      }
    } catch (e) {
      console.error("Failed to load batches:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/demo", { method: "POST" });
      if (res.ok) {
        await loadBatches();
      }
    } catch (e) {
      console.error("Failed to seed demo batch:", e);
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this batch?")) return;
    try {
      const res = await fetch(`/api/batches/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBatches((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete batch:", e);
    }
  };

  const totalSubmissions = batches.reduce(
    (sum, b) => sum + (b.submissions?.length || 0),
    0
  );

  const totalClaims = batches.reduce(
    (sum, b) => sum + (b.claim_findings?.length || 0),
    0
  );

  const totalDecisions = batches.reduce(
    (sum, b) => sum + (b.decisions?.length || 0),
    0
  );

  const totalFindings = batches.reduce(
    (sum, b) =>
      sum +
      (b.pair_findings?.filter((p) => p.relation !== "none")?.length || 0) +
      (b.claim_findings?.length || 0),
    0
  );

  const decisionVelocity =
    totalFindings > 0
      ? Math.round((totalDecisions / totalFindings) * 100)
      : 0;

  const filteredBatches = batches.filter((b) => {
    if (filter === "done") return b.status === "done";
    if (filter === "running") return b.status === "running" || b.status === "queued";
    return true;
  });

  return (
    <div className="container">
      {/* System Status Strip */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          paddingBottom: 16,
          marginBottom: 24,
          borderBottom: "1px solid rgba(16, 20, 38, 0.15)",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "var(--accent)",
              display: "inline-block",
            }}
          />
          <span className="caption-mono text-muted" style={{ letterSpacing: "0.05em" }}>
            FERPA ISOLATION ACTIVE · CLOCKED PRIVACY ENGINE · CORPUS GNS-102
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="caption-mono text-muted">
            Engine Mode: <strong style={{ color: "var(--ink)" }}>OFFICIAL SCHEMAS</strong>
          </span>
          <span
            className="caption-mono tag tag-draft"
            style={{ padding: "2px 8px" }}
          >
            REV-QUEUE: READY
          </span>
        </div>
      </div>

      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 32,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              Batches
            </h1>
            <span className="label-mono text-muted">
              {batches.length} {batches.length === 1 ? "batch" : "batches"}
            </span>
          </div>
          <p
            className="text-muted"
            style={{ margin: "6px 0 0 0", fontSize: 16, maxWidth: 640 }}
          >
            Academic review queues, pairwise document alignment, and grounded originality
            verification. Margin flags evidence for human evaluation; it never issues a verdict.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {batches.length === 0 && (
            <button
              onClick={handleSeedDemo}
              disabled={seeding}
              className="btn btn-secondary"
            >
              {seeding ? "Seeding..." : "Load GNS102 Demo"}
            </button>
          )}
          <Link href="/new" className="btn btn-primary">
            + New batch
          </Link>
        </div>
      </div>

      {/* Operational Diagnostics Bento Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
          marginBottom: 36,
        }}
      >
        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span className="caption-mono text-muted">QUEUE VOLUME</span>
            <span className="label-mono" style={{ color: "var(--accent)" }}>● LIVE</span>
          </div>
          <div style={{ margin: "14px 0", display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 40, fontWeight: 700, lineHeight: 1 }}>{totalSubmissions}</span>
            <span className="caption-mono text-muted">manuscripts ingested</span>
          </div>
          <div>
            <div className="progress-track" style={{ height: 6 }}>
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, totalSubmissions * 10)}%` }}
              />
            </div>
            <div
              className="caption-mono text-muted"
              style={{ marginTop: 6, display: "flex", justifyContent: "space-between" }}
            >
              <span>Capacity usage</span>
              <span>{totalSubmissions} / 20 max</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span className="caption-mono text-muted">EVIDENTIARY CLAIMS</span>
            <span className="label-mono" style={{ color: "var(--ink)" }}>GROUNDING</span>
          </div>
          <div style={{ margin: "14px 0", display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 40, fontWeight: 700, lineHeight: 1 }}>{totalClaims}</span>
            <span className="caption-mono" style={{ color: "var(--ink)", fontWeight: 600 }}>
              claims extracted & verified
            </span>
          </div>
          <div className="label-mono text-muted" style={{ fontSize: 11 }}>
            Grounded against course reading packs via Clocked Verify & Rerank
          </div>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span className="caption-mono text-muted">DECISION VELOCITY</span>
            <span className="label-mono" style={{ color: "var(--accent)" }}>HUMAN REVIEW</span>
          </div>
          <div style={{ margin: "14px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1 }}>
              {decisionVelocity}
              <span style={{ fontSize: 18, fontWeight: 400, color: "var(--muted)" }}>%</span>
            </div>
            <svg
              width="80"
              height="28"
              viewBox="0 0 80 28"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
            >
              <polyline
                points="0,24 16,20 32,22 48,12 64,15 80,4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="80" cy="4" r="3" fill="var(--ink)" stroke="var(--paper)" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="label-mono text-muted" style={{ fontSize: 11 }}>
            {totalDecisions} evaluated out of {totalFindings} flagged findings
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setFilter("all")}
          className={`btn btn-sm ${filter === "all" ? "btn-dark" : "btn-secondary"}`}
        >
          All ({batches.length})
        </button>
        <button
          onClick={() => setFilter("done")}
          className={`btn btn-sm ${filter === "done" ? "btn-dark" : "btn-secondary"}`}
        >
          Completed
        </button>
        <button
          onClick={() => setFilter("running")}
          className={`btn btn-sm ${filter === "running" ? "btn-dark" : "btn-secondary"}`}
        >
          In Progress
        </button>
      </div>

      {/* Batches Table Card */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Table Header Bar */}
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
          <span className="caption-mono text-muted" style={{ letterSpacing: "0.05em", fontWeight: 700 }}>
            BATCH IDENTIFIER & SCOPE
          </span>
          <div style={{ display: "flex", gap: 40 }}>
            <span className="caption-mono text-muted" style={{ letterSpacing: "0.05em", fontWeight: 700 }}>
              METRICS
            </span>
            <span className="caption-mono text-muted" style={{ letterSpacing: "0.05em", fontWeight: 700, minWidth: 100, textAlign: "right" }}>
              STATUS / AUDIT
            </span>
          </div>
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }} className="label-mono text-muted">
            Loading batches...
          </div>
        ) : filteredBatches.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <p className="text-muted" style={{ margin: "0 0 20px 0" }}>
              No review batches found matching this filter.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <button onClick={handleSeedDemo} disabled={seeding} className="btn btn-secondary">
                {seeding ? "Loading Demo..." : "Load GNS102 Demo Batch"}
              </button>
              <Link href="/new" className="btn btn-primary">
                Create new batch
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredBatches.map((b) => {
              const subCount = b.submissions?.length || 0;
              const pairCount = b.pair_findings?.length || 0;
              const conflictCount =
                b.pair_findings?.filter((p) => p.relation === "conflict")?.length || 0;
              const claimCount = b.claim_findings?.length || 0;
              const targetUrl =
                b.status === "done"
                  ? `/batches/${b.id}/overlap`
                  : `/batches/${b.id}/processing`;

              let statusTagClass = "tag-queued";
              let statusLabel = "Queued";
              if (b.status === "running") {
                statusTagClass = "tag-running";
                statusLabel = `Running (${b.current_step})`;
              } else if (b.status === "done") {
                const pendingDecisions =
                  (b.pair_findings?.filter((p) => p.relation !== "none")?.length || 0) -
                  (b.decisions?.length || 0);
                if (pendingDecisions > 0) {
                  statusTagClass = "tag-in_review";
                  statusLabel = "In review";
                } else {
                  statusTagClass = "tag-done";
                  statusLabel = "Evaluated";
                }
              }

              return (
                <div
                  key={b.id}
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
                  <Link
                    href={targetUrl}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      flex: 1,
                      minWidth: 260,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 16, fontWeight: 700 }}>{b.name}</span>
                      <span className="caption-mono tag tag-draft" style={{ padding: "1px 6px" }}>
                        {b.id}
                      </span>
                    </div>
                    <div
                      className="label-mono text-muted"
                      style={{ marginTop: 6, display: "flex", gap: 12, flexWrap: "wrap" }}
                    >
                      <span>{subCount} submissions</span>
                      <span>/</span>
                      <span>{pairCount} pairs</span>
                      {conflictCount > 0 && (
                        <>
                          <span>/</span>
                          <span style={{ color: "var(--ink)", fontWeight: 700 }}>
                            {conflictCount} conflict{conflictCount > 1 ? "s" : ""}
                          </span>
                        </>
                      )}
                      <span>/</span>
                      <span className="evidence-highlight" style={{ fontWeight: 600 }}>
                        {claimCount} claims grounded
                      </span>
                    </div>
                  </Link>

                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div className="caption-mono text-muted" style={{ textAlign: "right" }}>
                      {new Date(b.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>

                    <span className={`tag ${statusTagClass}`} style={{ minWidth: 90, justifyContent: "center" }}>
                      {statusLabel}
                    </span>

                    <Link href={targetUrl} className="btn btn-secondary btn-sm">
                      Open →
                    </Link>

                    <button
                      onClick={(e) => handleDelete(e, b.id)}
                      className="btn btn-sm"
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "transparent",
                        borderColor: "rgba(16,20,38,0.2)",
                        color: "var(--muted)",
                      }}
                      title="Delete batch"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
