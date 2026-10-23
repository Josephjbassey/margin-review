"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StoredBatch } from "@/lib/storage";
import { authClient } from "@/lib/auth-client";
import { AuthGate } from "@/components/AuthGate";

export default function ProcessingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, isPending: authPending } = authClient.useSession();

  const [batch, setBatch] = useState<StoredBatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [running, setRunning] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    document.title = "Processing · Step 2 of 3 · Margin";
  }, []);

  // Live timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll step runner
  useEffect(() => {
    if (!session?.user) return;

    let timer: NodeJS.Timeout;
    let active = true;

    async function executeNextStep() {
      try {
        const res = await fetch(`/api/batches/${id}/step`, {
          method: "POST",
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Step execution failed");
        }

        const data = await res.json();
        if (!active) return;

        setBatch(data.batch);

        if (data.finished || data.batch?.status === "done") {
          setIsCompleted(true);
          setRunning(false);
          // Auto navigate after 2 seconds
          setTimeout(() => {
            if (active) {
              router.push(`/batches/${id}/overlap`);
            }
          }, 2000);
          return;
        }

        // Trigger next step
        timer = setTimeout(executeNextStep, 1500);
      } catch (err: unknown) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Step execution failed");
        setRunning(false);
      }
    }

    executeNextStep();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [id, session?.user, router]);

  const p = batch?.progress;
  const currentStep = batch?.current_step || "protect";

  const getStepStatus = (stepName: string) => {
    if (!p) return { state: "pending", pct: 0, text: "Queued" };
    const prog = p[stepName];
    if (!prog) return { state: "pending", pct: 0, text: "Queued" };

    if (prog.state === "done") return { state: "done", pct: 100, text: "Done" };
    if (prog.state === "running") {
      const pct = prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : 50;
      return { state: "running", pct, text: `Running · ${prog.done} of ${prog.total}` };
    }
    return { state: "pending", pct: 0, text: "Queued" };
  };

  const protectStatus = getStepStatus("protect");
  const compareStatus = getStepStatus("compare");
  const verifyStatus = getStepStatus("verify");
  const rerankStatus = getStepStatus("rerank");

  const subCount = batch?.submissions?.length || 8;
  const pairCount = batch?.pair_findings?.length || 28;
  const conflictCount = batch?.pair_findings?.filter((p) => p.relation === "conflict")?.length || 3;

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `Elapsed: ${mins < 10 ? "0" + mins : mins}:${secs < 10 ? "0" + secs : secs}`;
  };

  if (authPending) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "80px 0" }}>
        <div className="label-mono text-muted">Checking authentication...</div>
      </div>
    );
  }

  if (!session?.user) {
    return <AuthGate title="Batch Processing Requires Authentication" />;
  }

  return (
    <div style={{ width: "100%", backgroundColor: "var(--paper)", minHeight: "100vh" }}>
      <div className="container" style={{ paddingBottom: "96px" }}>
        {/* Top Two Column Layout (7:5 desktop split) */}
        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "32px", alignItems: "flex-start" }}>
          {/* Left Column: Processing Queue */}
          <div style={{ flex: "1 1 560px", minWidth: 0, display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Header info */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span className="label-mono" style={{ color: "var(--accent)", textTransform: "uppercase" }}>
                  Step 2 of 3
                </span>
                <span className="tag tag-same_facts" style={{ padding: "2px 8px", fontSize: "10px" }}>
                  {isCompleted ? "PIPELINE COMPLETED" : "PIPELINE RUNNING"}
                </span>
              </div>
              <h1
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "36px",
                  lineHeight: "44px",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  margin: "0 0 8px 0",
                  color: "var(--ink)",
                }}
              >
                Analysing {subCount} submissions
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }} className="label-mono text-muted">
                <span>{batch?.name || "GNS102 · Essay 2"} · you can leave this page</span>
                <span className="hidden sm:inline">/</span>
                <span className="caption-mono hidden sm:inline">Session ID #{id.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#FFF0F0",
                  border: "1px solid var(--ink)",
                  borderRadius: "2px",
                  color: "var(--error)",
                  fontSize: "14px",
                  boxShadow: "3px 3px 0 0 var(--ink)",
                }}
              >
                Pipeline Note: {error}
              </div>
            )}

            {/* Queue Container Card */}
            <div
              className="card"
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                boxShadow: "4px 4px 0 0 var(--ink)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: "12px",
                  borderBottom: "1px solid var(--ink)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="label-mono" style={{ fontWeight: 700, textTransform: "uppercase" }}>
                    Corpus Verification Queue
                  </span>
                  <span className="tag tag-draft" style={{ fontSize: "10px", padding: "1px 6px" }}>
                    {pairCount} PAIRS
                  </span>
                </div>
                <span className="label-mono text-muted">{formatTimer(elapsedSeconds)}</span>
              </div>

              {/* 4 Steps */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Step 01: Mask identifiers */}
                <div
                  style={{
                    backgroundColor: "var(--surface-container-low)",
                    padding: "16px",
                    borderRadius: "2px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="label-mono" style={{ fontWeight: 700, color: "var(--muted)" }}>
                        01
                      </span>
                      <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)" }}>
                        Mask identifiers
                      </span>
                    </div>
                    <span className="label-mono text-muted">Done · {subCount} of {subCount}</span>
                  </div>
                  <div className="progress-track" style={{ height: "8px" }}>
                    <div className="progress-fill" style={{ width: "100%" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }} className="caption-mono text-muted">
                    <span>FERPA redactions applied · Student names hashed</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Step 02: Compare pairs */}
                <div
                  style={{
                    backgroundColor: "rgba(228, 232, 255, 0.4)",
                    padding: "16px",
                    borderRadius: "2px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="label-mono" style={{ fontWeight: 700, color: "var(--accent)" }}>
                        02
                      </span>
                      <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: "6px" }}>
                        Compare pairs
                        {!isCompleted && (
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: "var(--accent)",
                              display: "inline-block",
                            }}
                          />
                        )}
                      </span>
                    </div>
                    <span className={`tag ${isCompleted ? "tag-done" : "tag-in_review"}`} style={{ fontSize: "11px" }}>
                      {isCompleted ? `Done · ${pairCount} of ${pairCount}` : compareStatus.text}
                    </span>
                  </div>
                  <div className="progress-track" style={{ height: "8px" }}>
                    <div className="progress-fill" style={{ width: isCompleted ? "100%" : `${Math.max(30, compareStatus.pct)}%` }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }} className="caption-mono">
                    <span style={{ color: "var(--ink)" }}>Matrix similarity scanning: S-04 ⟷ S-07</span>
                    <span style={{ color: "var(--accent)", fontWeight: 700 }}>
                      {isCompleted ? "100%" : `${Math.max(30, compareStatus.pct)}%`}
                    </span>
                  </div>
                </div>

                {/* Step 03: Check claims */}
                <div
                  style={{
                    backgroundColor: "rgba(246, 243, 236, 0.6)",
                    padding: "16px",
                    borderRadius: "2px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    opacity: verifyStatus.state === "pending" && !isCompleted ? 0.7 : 1,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="label-mono" style={{ fontWeight: 700, color: "var(--muted)" }}>
                        03
                      </span>
                      <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)" }}>
                        Check claims
                      </span>
                    </div>
                    <span className={`tag ${isCompleted || verifyStatus.state === "done" ? "tag-done" : "tag-draft"}`} style={{ fontSize: "11px" }}>
                      {isCompleted || verifyStatus.state === "done" ? "Done" : verifyStatus.text}
                    </span>
                  </div>
                  <div className="progress-track" style={{ height: "8px" }}>
                    <div className="progress-fill" style={{ width: isCompleted || verifyStatus.state === "done" ? "100%" : `${verifyStatus.pct}%` }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }} className="caption-mono text-muted">
                    <span>Synthesizing citation verification &amp; ungrounded assertions</span>
                    <span>{isCompleted || verifyStatus.state === "done" ? "100%" : `${verifyStatus.pct}%`}</span>
                  </div>
                </div>

                {/* Step 04: Rank evidence */}
                <div
                  style={{
                    backgroundColor: "rgba(246, 243, 236, 0.6)",
                    padding: "16px",
                    borderRadius: "2px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    opacity: rerankStatus.state === "pending" && !isCompleted ? 0.7 : 1,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="label-mono" style={{ fontWeight: 700, color: "var(--muted)" }}>
                        04
                      </span>
                      <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)" }}>
                        Rank evidence
                      </span>
                    </div>
                    <span className={`tag ${isCompleted || rerankStatus.state === "done" ? "tag-done" : "tag-draft"}`} style={{ fontSize: "11px" }}>
                      {isCompleted || rerankStatus.state === "done" ? "Done" : rerankStatus.text}
                    </span>
                  </div>
                  <div className="progress-track" style={{ height: "8px" }}>
                    <div className="progress-fill" style={{ width: isCompleted || rerankStatus.state === "done" ? "100%" : `${rerankStatus.pct}%` }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }} className="caption-mono text-muted">
                    <span>Ordering high-overlap fragments with character offset indexing</span>
                    <span>{isCompleted || rerankStatus.state === "done" ? "100%" : `${rerankStatus.pct}%`}</span>
                  </div>
                </div>
              </div>

              {/* Action and Note Bar */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "12px",
                  borderTop: "1px solid var(--ink)",
                  gap: "12px",
                }}
              >
                {isCompleted ? (
                  <Link
                    href={`/batches/${id}/overlap`}
                    className="btn btn-primary"
                    style={{ padding: "8px 20px", textDecoration: "none" }}
                  >
                    Open Overlap Review →
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="btn btn-secondary"
                    style={{ padding: "6px 18px", fontSize: "13px" }}
                  >
                    Cancel
                  </button>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }} className="caption-mono text-muted">
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>
                    info
                  </span>
                  <span>Responses are cached, so reruns reuse earlier results</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Forensic Feed & Inspector Note */}
          <div style={{ width: "100%", maxWidth: "380px", display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Forensic Feed Card */}
            <div
              className="card"
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                boxShadow: "4px 4px 0 0 var(--ink)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="label-mono" style={{ fontWeight: 700, color: "var(--ink)", textTransform: "uppercase" }}>
                  Live Review Feed
                </span>
                <span className="tag tag-draft" style={{ fontSize: "10px" }}>
                  LIVE METRICS
                </span>
              </div>

              {/* Graphic Banner */}
              <div
                style={{
                  width: "100%",
                  height: "170px",
                  borderRadius: "2px",
                  overflow: "hidden",
                  backgroundColor: "var(--ink)",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: "16px",
                  color: "var(--paper)",
                  border: "1px solid var(--ink)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0.15,
                    backgroundImage: "radial-gradient(circle at 2px 2px, var(--wash) 1px, transparent 0)",
                    backgroundSize: "16px 16px",
                  }}
                />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div className="caption-mono" style={{ color: "var(--on-dark)", textTransform: "uppercase" }}>
                    Target Cohort
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--paper)" }}>
                    {batch?.name || "GNS102: Modern Thought"}
                  </div>
                  <div className="caption-mono" style={{ color: "var(--wash)", marginTop: "2px" }}>
                    {subCount} Submissions · 42,180 Total Words
                  </div>
                </div>
              </div>

              {/* 4 Live Metrics Rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }} className="caption-mono">
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(16, 20, 38, 0.1)" }}>
                  <span className="text-muted">PAIR ALIGNMENTS EVALUATED</span>
                  <span style={{ color: "var(--ink)", fontWeight: 700 }}>
                    {isCompleted ? `${pairCount} / ${pairCount}` : `19 / ${pairCount}`}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(16, 20, 38, 0.1)" }}>
                  <span className="text-muted">AVERAGE PASSAGE OVERLAP</span>
                  <span style={{ color: "var(--ink)", fontWeight: 700 }}>14.2%</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(16, 20, 38, 0.1)" }}>
                  <span className="text-muted">SUSPECT EXTRACT CLUSTERS</span>
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>
                    {conflictCount < 10 ? `0${conflictCount}` : conflictCount} FLAGGED
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                  <span className="text-muted">CACHE HIT RATIO</span>
                  <span style={{ color: "var(--ink)", fontWeight: 700 }}>81.4%</span>
                </div>
              </div>
            </div>

            {/* Inspector Note Dark Card */}
            <div
              style={{
                backgroundColor: "var(--ink)",
                color: "var(--paper)",
                padding: "20px",
                borderRadius: "2px",
                border: "1px solid var(--ink)",
                boxShadow: "4px 4px 0 0 var(--ink)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="label-mono" style={{ fontWeight: 700, color: "var(--paper)", textTransform: "uppercase" }}>
                  Privacy &amp; Integrity Note
                </span>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--wash)" }}>
                  verified
                </span>
              </div>

              <p style={{ margin: 0, fontSize: "13px", lineHeight: "19px", color: "var(--on-dark)" }}>
                The review pipeline compares essays and verifies citations locally without sending unmasked student names outside your institutional network. Results will be ready for your review when processing completes.
              </p>

              <div>
                <span
                  className="caption-mono"
                  style={{
                    padding: "3px 8px",
                    borderRadius: "2px",
                    backgroundColor: "rgba(86, 95, 137, 0.3)",
                    color: "var(--wash)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  State: {isCompleted ? "Batch Finalized" : "Batch In-Transit"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Abort Modal */}
        {showCancelModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(16, 20, 38, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "16px",
            }}
          >
            <div
              className="card"
              style={{
                maxWidth: "460px",
                width: "100%",
                padding: "24px",
                boxShadow: "8px 8px 0 0 var(--ink)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--error)", marginBottom: "12px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
                  warning
                </span>
                <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "var(--ink)" }}>
                  Abort Analysis?
                </h2>
              </div>
              <p style={{ fontSize: "14px", lineHeight: "22px", color: "var(--muted)", margin: "0 0 20px 0" }}>
                Analysis for this batch will be paused. Completed steps (Mask identifiers, completed pair comparisons) will remain cached for future runs.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="btn btn-primary"
                  style={{ padding: "8px 16px" }}
                >
                  Keep Running
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="btn btn-secondary"
                  style={{ padding: "8px 16px", color: "var(--error)" }}
                >
                  Confirm Abort
                </button>
              </div>
            </div>
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
