"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StoredBatch } from "@/lib/storage";
import { FooterBand } from "@/components/FooterBand";
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

  useEffect(() => {
    document.title = "Pipeline Processing · Margin Academic Review";
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
      } catch (err: any) {
        if (!active) return;
        setError(err.message);
        setRunning(false);
      }
    }

    executeNextStep();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [id, router]);

  const p = batch?.progress;
  const currentStep = batch?.current_step || "protect";

  const getStepStatus = (stepName: string) => {
    if (!p) return { state: "pending", pct: 0, text: "Queued" };
    const prog = p[stepName];
    if (!prog) return { state: "pending", pct: 0, text: "Queued" };

    if (prog.state === "done") return { state: "done", pct: 100, text: "Done" };
    if (prog.state === "running") {
      const pct = prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : 50;
      return { state: "running", pct, text: `${prog.done}/${prog.total}` };
    }
    return { state: "pending", pct: 0, text: "Waiting" };
  };

  const protectStatus = getStepStatus("protect");
  const compareStatus = getStepStatus("compare");
  const verifyStatus = getStepStatus("verify");
  const rerankStatus = getStepStatus("rerank");

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
    <div className="container" style={{ paddingBottom: 120 }}>

      <div style={{ marginBottom: 20 }}>
        <Link href="/" className="caption-mono text-muted" style={{ textDecoration: "none" }}>
          ← Back to Batches
        </Link>
      </div>

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
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span
              className={`tag ${isCompleted ? "tag-done" : "tag-running"}`}
              style={{ fontWeight: 700 }}
            >
              {isCompleted ? "Completed" : `Running: ${currentStep.toUpperCase()}`}
            </span>
            <span className="caption-mono tag tag-draft">ID: {id}</span>
          </div>
          <h1 className="page-title" style={{ margin: 0 }}>
            {batch?.name || "Processing Review Batch..."}
          </h1>
          <p className="text-muted" style={{ margin: "6px 0 0 0", fontSize: 16 }}>
            Running Clocked forensic text pipeline with FERPA isolation. Margin flags findings for human
            decision; it never issues a verdict.
          </p>
        </div>

        {isCompleted && (
          <Link href={`/batches/${id}/overlap`} className="btn btn-primary">
            Review Overlap Findings →
          </Link>
        )}
      </div>

      {error && (
        <div
          className="card"
          style={{
            marginBottom: 24,
            borderColor: "var(--ink)",
            backgroundColor: "#FFF0F0",
            color: "#900",
            fontWeight: 500,
          }}
        >
          Pipeline Error: {error}
        </div>
      )}

      {/* 4 Pipeline Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 36 }}>
        {/* Step 1: Ingest */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="caption-mono tag tag-same_facts">STEP 1</span>
              <strong style={{ fontSize: 15 }}>Document Ingestion & Anonymization</strong>
            </div>
            <span className="caption-mono tag tag-done">DONE</span>
          </div>
          <p className="caption-mono text-muted" style={{ margin: 0 }}>
            Extracted text from {batch?.submissions?.length || 0} student essays and{" "}
            {batch?.reading_pack?.length || 0} reference chapters. Assigned sequential labels (S-01, S-02, R-01).
          </p>
        </div>

        {/* Step 2: Protect */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="caption-mono tag tag-same_facts">STEP 2</span>
              <strong style={{ fontSize: 15 }}>Clocked Protect (PII Masking)</strong>
            </div>
            <span className={`caption-mono tag ${protectStatus.state === "done" ? "tag-done" : "tag-running"}`}>
              {protectStatus.text}
            </span>
          </div>
          <div className="progress-track" style={{ height: 6, margin: "10px 0" }}>
            <div className="progress-fill" style={{ width: `${protectStatus.pct}%` }} />
          </div>
          <p className="caption-mono text-muted" style={{ margin: 0 }}>
            {batch?.total_identifiers_masked
              ? `${batch.total_identifiers_masked} student identifiers masked. Only masked text is used for comparisons.`
              : "Detecting student names, matriculation numbers, and emails..."}
          </p>
        </div>

        {/* Step 3: Compare */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="caption-mono tag tag-same_facts">STEP 3</span>
              <strong style={{ fontSize: 15 }}>Clocked Compare (Pairwise Alignment)</strong>
            </div>
            <span className={`caption-mono tag ${compareStatus.state === "done" ? "tag-done" : compareStatus.state === "running" ? "tag-running" : "tag-draft"}`}>
              {compareStatus.text}
            </span>
          </div>
          <div className="progress-track" style={{ height: 6, margin: "10px 0" }}>
            <div className="progress-fill" style={{ width: `${compareStatus.pct}%` }} />
          </div>
          <p className="caption-mono text-muted" style={{ margin: 0 }}>
            Comparing submission pairs for conflicts, duplicates, same facts, and overlaps. Conflicts prioritized.
          </p>
        </div>

        {/* Step 4: Verify & Rerank */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="caption-mono tag tag-same_facts">STEP 4</span>
              <strong style={{ fontSize: 15 }}>Clocked Verify & Rerank (Grounding)</strong>
            </div>
            <span className={`caption-mono tag ${verifyStatus.state === "done" && rerankStatus.state === "done" ? "tag-done" : verifyStatus.state === "running" || rerankStatus.state === "running" ? "tag-running" : "tag-draft"}`}>
              {verifyStatus.state === "done" && rerankStatus.state === "done" ? "DONE" : verifyStatus.text}
            </span>
          </div>
          <div className="progress-track" style={{ height: 6, margin: "10px 0" }}>
            <div
              className="progress-fill"
              style={{
                width: `${(verifyStatus.pct + rerankStatus.pct) / 2}%`,
              }}
            />
          </div>
          <p className="caption-mono text-muted" style={{ margin: 0 }}>
            Verifying factual claims against course reading pack and reranking relevant passages for unsupported claims.
          </p>
        </div>
      </div>

      {/* Completion Banner */}
      {isCompleted && (
        <div
          className="card"
          style={{
            backgroundColor: "var(--selected)",
            padding: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
              ✓ Analysis Complete
            </div>
            <div className="caption-mono text-muted">
              {batch?.pair_findings?.length || 0} pairs evaluated ·{" "}
              {batch?.claim_findings?.length || 0} claims grounded · Ready for human review
            </div>
          </div>
          <Link href={`/batches/${id}/overlap`} className="btn btn-primary">
            Proceed to Overlap Review →
          </Link>
        </div>
      )}

      {/* Dark ink footer band */}
      <FooterBand
        note={`Protect · ${batch?.total_identifiers_masked || 0} student identifiers masked before comparison`}
        metric="FERPA Isolation Active"
      />
    </div>
  );
}
