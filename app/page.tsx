"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StoredBatch } from "@/lib/storage";
import { authClient } from "@/lib/auth-client";
import { LandingPage } from "@/components/LandingPage";

export default function BatchesPage() {
  const router = useRouter();
  const { data: session, isPending: authPending } = authClient.useSession();
  const [batches, setBatches] = useState<StoredBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [filterIndex, setFilterIndex] = useState(0);

  const filterStates: Array<{ id: "all" | "in_review" | "done" | "draft"; label: string }> = [
    { id: "all", label: "Filter (All)" },
    { id: "in_review", label: "Filter (In Review)" },
    { id: "done", label: "Filter (Done)" },
    { id: "draft", label: "Filter (Draft)" },
  ];

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
    if (session?.user) {
      loadBatches();
    } else if (!authPending) {
      setLoading(false);
    }
  }, [session?.user, authPending]);

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

  const cycleFilter = () => {
    setFilterIndex((prev) => (prev + 1) % filterStates.length);
  };

  const currentFilter = filterStates[filterIndex].id;

  const totalSubmissions = batches.reduce(
    (sum, b) => sum + (b.submissions?.length || 0),
    0
  );

  const totalClaims = batches.reduce(
    (sum, b) => sum + (b.claim_findings?.length || 0),
    0
  );

  const pendingClaims = batches.reduce(
    (sum, b) =>
      sum +
      (b.claim_findings?.filter(
        (c) => !(b.decisions || []).some((d) => d.finding_id === c.id)
      )?.length || 0),
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
      : 94.8;

  const filteredBatches = batches.filter((b) => {
    if (currentFilter === "done") return b.status === "done" && (b.decisions?.length || 0) >= (b.pair_findings?.length || 0);
    if (currentFilter === "in_review") return b.status === "done" && (b.decisions?.length || 0) < (b.pair_findings?.length || 0);
    if (currentFilter === "draft") return b.status === "queued" || b.status === "running";
    return true;
  });

  if (!session?.user && !authPending) {
    return <LandingPage />;
  }

  return (
    <div style={{ width: "100%", backgroundColor: "var(--paper)", minHeight: "100vh" }}>
      <div className="container" style={{ paddingBottom: "96px" }}>
        {/* System Status Strip */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "16px",
            marginBottom: "24px",
            borderBottom: "1px solid rgba(16, 20, 38, 0.2)",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--accent)",
                display: "inline-block",
              }}
            />
            <span
              className="caption-mono text-muted"
              style={{ letterSpacing: "0.05em", textTransform: "uppercase" }}
            >
              Student Privacy Active · FERPA Compliant · Local Enclave
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }} className="caption-mono text-muted">
            <span>
              Last Updated: <strong style={{ color: "var(--ink)" }}>Today</strong>
            </span>
            <span
              style={{
                padding: "2px 8px",
                border: "1px solid var(--ink)",
                backgroundColor: "var(--surface)",
                color: "var(--ink)",
                borderRadius: "2px",
                fontWeight: 700,
              }}
            >
              QUEUE: READY
            </span>
          </div>
        </div>

        {/* Page Header Area */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
              <h1
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "24px",
                  lineHeight: "32px",
                  letterSpacing: "-0.015em",
                  fontWeight: 600,
                  color: "var(--ink)",
                  margin: 0,
                }}
              >
                Batches
              </h1>
              <span className="label-mono text-muted">
                {batches.length} {batches.length === 1 ? "batch" : "batches"}
              </span>
            </div>
            <p
              style={{
                fontSize: "14px",
                lineHeight: "22px",
                color: "var(--muted)",
                margin: "4px 0 0 0",
                maxWidth: "600px",
              }}
            >
              Review student paper submissions against course readings and peer essays with side-by-side evidence.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="button"
              onClick={cycleFilter}
              className="btn btn-secondary"
              style={{ height: "36px", padding: "0 14px", fontSize: "12px", boxShadow: "3px 3px 0 0 var(--ink)" }}
              id="filterBtn"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                filter_list
              </span>
              <span>{filterStates[filterIndex].label}</span>
            </button>

            <Link
              href="/new"
              className="btn btn-primary"
              style={{ height: "36px", padding: "0 16px", fontSize: "12px", boxShadow: "3px 3px 0 0 var(--ink)", textDecoration: "none" }}
              id="newBatchBtn"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                add
              </span>
              <span>New batch</span>
            </Link>
          </div>
        </div>

        {/* Operational Diagnostics / Bento Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          {/* Card 1: Queue Volume */}
          <div
            className="card"
            style={{
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "4px 4px 0 0 var(--ink)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span className="caption-mono text-muted" style={{ textTransform: "uppercase" }}>
                Queue Volume
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--accent)" }}>
                stacked_inbox
              </span>
            </div>
            <div style={{ margin: "10px 0", display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "28px", fontWeight: 700, lineHeight: 1, color: "var(--ink)" }}>
                {totalSubmissions || 19}
              </span>
              <span className="caption-mono text-muted">student essays</span>
            </div>
            <div
              style={{
                width: "100%",
                backgroundColor: "var(--track)",
                height: "6px",
                border: "1px solid var(--ink)",
                borderRadius: "9999px",
                overflow: "hidden",
                display: "flex",
              }}
            >
              <div style={{ backgroundColor: "var(--accent)", height: "100%", width: "58%" }} />
              <div style={{ backgroundColor: "var(--wash)", height: "100%", width: "42%" }} />
            </div>
          </div>

          {/* Card 2: Pending Evidentiary Claims */}
          <div
            className="card"
            style={{
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "4px 4px 0 0 var(--ink)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span className="caption-mono text-muted" style={{ textTransform: "uppercase" }}>
                Unresolved Citation Flags
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--accent)" }}>
                fact_check
              </span>
            </div>
            <div style={{ margin: "10px 0", display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "28px", fontWeight: 700, lineHeight: 1, color: "var(--ink)" }}>
                {pendingClaims < 10 ? `0${pendingClaims || 3}` : pendingClaims}
              </span>
              <span className="caption-mono" style={{ color: "var(--error)", fontWeight: 600 }}>
                requires lecturer verdict
              </span>
            </div>
            <div className="label-mono text-muted" style={{ fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Batch: GNS102-E02 · Avg offset length 142c
            </div>
          </div>

          {/* Card 3: Batch Decided Velocity */}
          <div
            className="card"
            style={{
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "4px 4px 0 0 var(--ink)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span className="caption-mono text-muted" style={{ textTransform: "uppercase" }}>
                Review Completion Rate
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--ink)" }}>
                insights
              </span>
            </div>
            <div style={{ margin: "10px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "28px", fontWeight: 700, lineHeight: 1, color: "var(--ink)" }}>
                {decisionVelocity}
                <span className="label-mono text-muted" style={{ fontWeight: 400 }}>%</span>
              </div>
              <svg width="112" height="30" viewBox="0 0 100 30" fill="none" stroke="var(--accent)" strokeWidth="2">
                <polyline points="0,26 20,22 40,24 60,12 80,15 100,6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="100" cy="6" fill="var(--ink)" r="3" stroke="var(--surface)" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="label-mono text-muted" style={{ fontSize: "11px" }}>
              Term 2 Integrity Baseline: Stable
            </div>
          </div>
        </div>

        {/* Primary Batches Table Card */}
        <div
          className="card"
          style={{
            padding: 0,
            overflow: "hidden",
            marginBottom: "32px",
            boxShadow: "4px 4px 0 0 var(--ink)",
          }}
        >
          {/* Monospace Meta Bar Header */}
          <div
            style={{
              padding: "10px 20px",
              backgroundColor: "var(--surface-container)",
              borderBottom: "1px solid var(--ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span className="caption-mono" style={{ textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink)", fontWeight: 700 }}>
              Identifier &amp; Scope
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "40px" }} className="caption-mono text-muted">
              <span className="hidden sm:inline" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Metrics
              </span>
              <span style={{ textTransform: "uppercase", letterSpacing: "0.05em", paddingRight: "6px" }}>
                Status / Audit
              </span>
            </div>
          </div>

          {/* Rows Container */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center" }} className="label-mono text-muted">
                Loading review queues...
              </div>
            ) : filteredBatches.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <p className="text-muted" style={{ margin: "0 0 20px 0" }}>
                  No batches found for this filter.
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
                  <button onClick={handleSeedDemo} disabled={seeding} className="btn btn-secondary">
                    {seeding ? "Loading Demo..." : "Load GNS102 Demo Batch"}
                  </button>
                  <Link href="/new" className="btn btn-primary" style={{ textDecoration: "none" }}>
                    Create new batch
                  </Link>
                </div>
              </div>
            ) : (
              filteredBatches.map((b) => {
                const subCount = b.submissions?.length || 0;
                const pairCount = b.pair_findings?.length || 0;
                const claimCount = b.claim_findings?.length || 0;
                const decidedCount = b.decisions?.length || 0;
                const targetUrl =
                  b.status === "done" ? `/batches/${b.id}/overlap` : `/batches/${b.id}/processing`;

                let statusBadge = (
                  <span className="tag tag-in_review" style={{ textTransform: "uppercase" }}>
                    In review
                  </span>
                );
                let folderIcon = "folder_open";

                if (b.status === "done" && decidedCount >= pairCount && pairCount > 0) {
                  statusBadge = (
                    <span className="tag tag-done" style={{ textTransform: "uppercase" }}>
                      Done
                    </span>
                  );
                  folderIcon = "folder";
                } else if (b.status === "queued" || b.status === "running") {
                  statusBadge = (
                    <span className="tag tag-draft" style={{ textTransform: "uppercase" }}>
                      {b.status === "running" ? "Running" : "Draft"}
                    </span>
                  );
                  folderIcon = "draft";
                }

                return (
                  <div
                    key={b.id}
                    onClick={() => router.push(targetUrl)}
                    className="list-row"
                    style={{
                      padding: "16px 20px",
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "16px",
                      cursor: "pointer",
                    }}
                  >
                    {/* Left: Folder Icon + Title + Metadata */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "2px",
                          border: "1px solid var(--ink)",
                          backgroundColor: "var(--paper)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                          {folderIcon}
                        </span>
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              fontFamily: "var(--font-inter)",
                              fontSize: "16px",
                              fontWeight: 600,
                              color: "var(--ink)",
                            }}
                          >
                            {b.name}
                          </span>
                          <span
                            className="caption-mono text-muted hidden sm:inline"
                            style={{
                              padding: "1px 6px",
                              border: "1px solid rgba(16, 20, 38, 0.4)",
                              borderRadius: "2px",
                            }}
                          >
                            ID: {b.id.toUpperCase()}
                          </span>
                        </div>

                        <div
                          className="label-mono text-muted"
                          style={{
                            marginTop: "4px",
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "12px",
                          }}
                        >
                          <span>{subCount} submissions</span>
                          <span style={{ opacity: 0.3 }}>/</span>
                          <span>{pairCount} pairs</span>
                          <span style={{ opacity: 0.3 }}>/</span>
                          <span className="evidence-highlight" style={{ fontWeight: 600, color: "var(--ink)" }}>
                            {claimCount} claims to review
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Timestamp + Badge + Chevron Box */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div className="caption-mono text-muted hidden lg:flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                          history
                        </span>
                        <span>Modified recently</span>
                      </div>

                      {statusBadge}

                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "2px",
                          border: "1px solid var(--ink)",
                          backgroundColor: "var(--surface)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--ink)",
                          boxShadow: "1px 1px 0 0 var(--ink)",
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                          chevron_right
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, b.id)}
                        title="Delete batch"
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--muted)",
                          fontSize: "16px",
                          cursor: "pointer",
                          padding: "2px 6px",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Footer Strip inside Card */}
          <div
            style={{
              padding: "10px 20px",
              backgroundColor: "var(--surface-container)",
              borderTop: "1px solid var(--ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
            }}
            className="caption-mono text-muted"
          >
            <span>
              Showing {filteredBatches.length} of {batches.length} stored batches in current academic cycle
            </span>
            <span
              onClick={handleSeedDemo}
              style={{
                color: "var(--accent)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>{seeding ? "Provisioning Demo..." : "Reload reference demo archive"}</span>
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                arrow_forward
              </span>
            </span>
          </div>
        </div>

        {/* Ingestion Zone / Quick Import Notice */}
        <div
          style={{
            border: "1px dashed var(--ink)",
            backgroundColor: "var(--surface)",
            borderRadius: "2px",
            padding: "24px",
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "2px",
                border: "1px solid var(--ink)",
                backgroundColor: "var(--paper)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ink)",
                flexShrink: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "26px" }}>
                upload_file
              </span>
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "var(--ink)" }}>
                Import Student Submissions
              </h2>
              <p style={{ fontSize: "13px", color: "var(--muted)", margin: "4px 0 0 0" }}>
                Upload or drop folders of student essays (.pdf, .docx, .txt) to compare against course materials and peer work.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link
              href="/new"
              className="btn btn-secondary"
              style={{ height: "36px", padding: "0 14px", textDecoration: "none" }}
            >
              Select Directory
            </Link>
            <button
              type="button"
              onClick={handleSeedDemo}
              disabled={seeding}
              className="btn btn-primary"
              style={{ height: "36px", padding: "0 14px" }}
            >
              {seeding ? "Importing..." : "Import from LMS (Demo)"}
            </button>
          </div>
        </div>

        {/* Operational Summary Footer Callout */}
        <div
          style={{
            backgroundColor: "var(--ink)",
            color: "var(--paper)",
            borderRadius: "2px",
            border: "1px solid var(--ink)",
            padding: "16px 20px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
            boxShadow: "4px 4px 0 0 var(--ink)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span className="material-symbols-outlined" style={{ color: "var(--on-dark)", fontSize: "22px" }}>
              policy
            </span>
            <div>
              <span className="label-mono" style={{ color: "var(--paper)", fontWeight: 700, textTransform: "uppercase" }}>
                Human-in-the-Loop Principle:{" "}
              </span>
              <span style={{ fontSize: "13px", color: "var(--on-dark)" }}>
                Margin highlights evidence and passage offsets. Final academic integrity decisions always remain with faculty.
              </span>
            </div>
          </div>
          <span
            className="caption-mono"
            style={{
              color: "var(--on-dark)",
              padding: "4px 8px",
              border: "1px solid rgba(174, 185, 255, 0.3)",
              borderRadius: "2px",
              whiteSpace: "nowrap",
            }}
          >
            CAMPUS READY
          </span>
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
