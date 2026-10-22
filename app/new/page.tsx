"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { AuthGate } from "@/components/AuthGate";

const MAX_PAIRS = 20;

export default function NewBatchPage() {
  const router = useRouter();
  const { data: session, isPending: authPending } = authClient.useSession();

  useEffect(() => {
    document.title = "New batch · Step 1 of 3 · Margin";
  }, []);

  const [name, setName] = useState("GNS102 · Essay 2");
  const [submissions, setSubmissions] = useState<File[]>([]);
  const [readingPack, setReadingPack] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submissionCount = submissions.length;
  const pairCount = (submissionCount * (submissionCount - 1)) / 2;
  const isPairExceeded = pairCount > MAX_PAIRS;

  const handleSubmissionsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSubmissions((prev) => [...prev, ...newFiles]);
    }
  };

  const handleReadingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setReadingPack((prev) => [...prev, ...newFiles]);
    }
  };

  const removeSubmission = (idx: number) => {
    setSubmissions((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeReading = (idx: number) => {
    setReadingPack((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleLoadSample = async () => {
    setLoadingSample(true);
    setError(null);
    try {
      const res = await fetch("/api/sample-files");
      if (!res.ok) throw new Error("Failed to load sample files");
      const data = await res.json();

      const subFiles = (data.submissions || []).slice(0, 6).map((item: any) => {
        return new File([item.content], item.name, { type: "text/plain" });
      });

      const readFiles = (data.readingPack || []).map((item: any) => {
        return new File([item.content], item.name, { type: "text/plain" });
      });

      setSubmissions(subFiles);
      setReadingPack(readFiles);
      setName("GNS102 · Essay 2 (Modern Thought)");
    } catch (err: any) {
      setError(err.message || "Failed to load sample dataset");
    } finally {
      setLoadingSample(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submissions.length < 2) {
      setError("At least two submission files are required for pairwise comparison.");
      return;
    }
    if (isPairExceeded) {
      setError(`Cannot exceed MAX_PAIRS (${MAX_PAIRS}). Currently ${pairCount} pairs requested.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", name);
      for (const file of submissions) {
        formData.append("submissions", file);
      }
      for (const file of readingPack) {
        formData.append("reading_pack", file);
      }

      const res = await fetch("/api/batches", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to create batch");
      }

      router.push(`/batches/${result.id}/processing`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (authPending) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "80px 0" }}>
        <div className="label-mono text-muted">Checking authentication...</div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <AuthGate
        title="Batch Creation Requires Authentication"
        subtitle="You must be signed in as an authorized lecturer to create review queues and upload student papers."
      />
    );
  }

  return (
    <div style={{ width: "100%", backgroundColor: "var(--paper)", minHeight: "100vh" }}>
      <div className="container" style={{ paddingBottom: "96px" }}>
        {/* Progress Header & Workflow Metadata */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "20px",
            paddingBottom: "24px",
            borderBottom: "1px solid var(--ink)",
            marginBottom: "32px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span className="tag tag-conflict" style={{ padding: "2px 8px", fontSize: "10px" }}>
                STAGE · UPLOAD
              </span>
              <span className="label-mono text-muted" style={{ textTransform: "uppercase" }}>
                Step 1 of 3
              </span>
            </div>
            <h1
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "24px",
                lineHeight: "32px",
                fontWeight: 600,
                letterSpacing: "-0.015em",
                margin: 0,
                color: "var(--ink)",
              }}
            >
              New batch
            </h1>
          </div>

          {/* Step Tracking Pipeline Visual */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "var(--accent)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                }}
              >
                1
              </span>
              <span className="label-mono" style={{ fontWeight: 700, color: "var(--ink)" }}>
                Upload Files
              </span>
            </div>
            <div style={{ width: "32px", height: "2px", backgroundColor: "var(--ink)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "6px", opacity: 0.5 }}>
              <span
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--ink)",
                  color: "var(--ink)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                }}
              >
                2
              </span>
              <span className="label-mono text-muted">Compare Essays</span>
            </div>
            <div style={{ width: "32px", height: "2px", backgroundColor: "var(--track)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "6px", opacity: 0.5 }}>
              <span
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--muted)",
                  color: "var(--muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                }}
              >
                3
              </span>
              <span className="label-mono text-muted">Check Citations</span>
            </div>
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
              marginBottom: "24px",
              boxShadow: "3px 3px 0 0 var(--ink)",
            }}
          >
            {error}
          </div>
        )}

        {/* Primary Configuration Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* Batch Identity Block */}
          <div style={{ maxWidth: "560px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <label className="label-mono" style={{ fontWeight: 700, textTransform: "uppercase" }} htmlFor="batch-name">
                Batch Name / Reference ID
              </label>
              <span className="caption-mono text-muted">FERPA-SECURE ID</span>
            </div>
            <div style={{ position: "relative" }}>
              <input
                id="batch-name"
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. GNS102 · Essay 2"
                style={{ paddingRight: "80px", fontWeight: 600 }}
              />
              <div
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  color: "var(--muted)",
                  pointerEvents: "none",
                }}
                className="caption-mono"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  verified
                </span>
                <span>SECURE</span>
              </div>
            </div>
          </div>

          {/* Quick Demo Pre-load Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <span className="caption-mono text-muted">
              Select student papers and course readings or load sample files:
            </span>
            <button
              type="button"
              onClick={handleLoadSample}
              disabled={loadingSample}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: "12px" }}
            >
              {loadingSample ? "Staging..." : "⚡ Stage Reference GNS102 Sample Files"}
            </button>
          </div>

          {/* Intake Mosaic Grid (7:5 Column Split) */}
          <div className="review-grid" style={{ alignItems: "start" }}>
            {/* Card 1: Submissions Drop & Registry (7 cols) */}
            <div
              className="card"
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
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
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                    folder_supervised
                  </span>
                  <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>Submissions</h2>
                </div>
                <span className="tag tag-same_facts" style={{ fontWeight: 700 }}>
                  {submissions.length} files staged
                </span>
              </div>

              {/* Dropzone */}
              <label
                className="dropzone"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  padding: "28px 16px",
                  backgroundColor: "rgba(244, 241, 234, 0.6)",
                }}
              >
                <input
                  type="file"
                  multiple
                  accept=".txt,.docx"
                  onChange={handleSubmissionsUpload}
                  style={{ display: "none" }}
                />
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    border: "1px solid var(--ink)",
                    backgroundColor: "var(--surface)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "2px 2px 0 0 var(--ink)",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                    upload_file
                  </span>
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: "14px" }}>
                    Drop .txt or .docx files
                  </div>
                  <div className="caption-mono text-muted">
                    Individual student essays up to 25 MB each
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: "4px", pointerEvents: "none" }}
                >
                  Choose files
                </button>
              </label>

              {/* Staged Stream Table */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "6px",
                    borderBottom: "1px solid rgba(16, 20, 38, 0.3)",
                  }}
                  className="caption-mono text-muted"
                >
                  <span style={{ textTransform: "uppercase" }}>Student Paper Name</span>
                  <div style={{ display: "flex", gap: "24px" }}>
                    <span>SIZE</span>
                    <span>STATUS</span>
                  </div>
                </div>

                <div
                  style={{
                    maxHeight: "220px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  className="label-mono"
                >
                  {submissions.length === 0 ? (
                    <div style={{ padding: "16px 0", textAlign: "center" }} className="caption-mono text-muted">
                      No student papers added yet. Drag files above.
                    </div>
                  ) : (
                    submissions.map((f, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "8px 4px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottom: "1px solid rgba(16, 20, 38, 0.1)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                            description
                          </span>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {f.name}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexShrink: 0 }}>
                          <span className="caption-mono text-muted">
                            {(f.size / 1024).toFixed(1)} KB
                          </span>
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: "var(--accent)",
                              display: "inline-block",
                            }}
                            title="Ready to index"
                          />
                          <button
                            type="button"
                            onClick={() => removeSubmission(i)}
                            style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "0 4px" }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Reading Pack / Baseline Authority (5 cols) */}
            <div
              className="card"
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
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
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                    auto_stories
                  </span>
                  <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>Reading pack</h2>
                </div>
                <span className="tag tag-draft" style={{ fontWeight: 700 }}>
                  {readingPack.length} files
                </span>
              </div>

              {/* Dropzone */}
              <label
                className="dropzone"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  padding: "28px 16px",
                  backgroundColor: "rgba(244, 241, 234, 0.6)",
                }}
              >
                <input
                  type="file"
                  multiple
                  accept=".txt,.docx"
                  onChange={handleReadingUpload}
                  style={{ display: "none" }}
                />
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    border: "1px solid var(--ink)",
                    backgroundColor: "var(--surface)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "2px 2px 0 0 var(--ink)",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                    library_books
                  </span>
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: "14px" }}>
                    Drop the course material
                  </div>
                  <div className="caption-mono text-muted">
                    PDF, Markdown or DOCX canonical texts
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: "4px", pointerEvents: "none" }}
                >
                  Choose files
                </button>
              </label>

              {/* Staged Stream Table */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "6px",
                    borderBottom: "1px solid rgba(16, 20, 38, 0.3)",
                  }}
                  className="caption-mono text-muted"
                >
                  <span style={{ textTransform: "uppercase" }}>Source Reference File</span>
                  <div style={{ display: "flex", gap: "24px" }}>
                    <span>SIZE</span>
                    <span>SCOPE</span>
                  </div>
                </div>

                <div
                  style={{
                    maxHeight: "220px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  className="label-mono"
                >
                  {readingPack.length === 0 ? (
                    <div style={{ padding: "16px 0", textAlign: "center" }} className="caption-mono text-muted">
                      No course materials staged yet.
                    </div>
                  ) : (
                    readingPack.map((f, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "8px 4px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottom: "1px solid rgba(16, 20, 38, 0.1)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>
                            menu_book
                          </span>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {f.name}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                          <span className="caption-mono text-muted">
                            {(f.size / 1024).toFixed(1)} KB
                          </span>
                          <span className="tag tag-same_facts" style={{ fontSize: "10px", padding: "1px 6px" }}>
                            {i === 0 ? "PRIMARY" : "REF"}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeReading(i)}
                            style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "0 4px" }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Forensic Note */}
              <div
                style={{
                  marginTop: "auto",
                  backgroundColor: "var(--surface-container)",
                  border: "1px solid rgba(16, 20, 38, 0.3)",
                  padding: "12px",
                  borderRadius: "2px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--ink)", marginTop: "2px" }}>
                  fingerprint
                </span>
                <p style={{ margin: 0, fontSize: "12px", lineHeight: "17px", color: "var(--muted)" }}>
                  Passages from uploaded reading packets serve as the ground-truth index for alignment offset calculations.
                </p>
              </div>
            </div>
          </div>

          {/* Alignment Engine Configuration Callout */}
          <div
            style={{
              width: "100%",
              backgroundColor: "var(--paper)",
              border: "1px solid var(--ink)",
              borderRadius: "2px",
              padding: "16px 20px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              boxShadow: "3px 3px 0 0 var(--ink)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
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
                  flexShrink: 0,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  tune
                </span>
              </div>
              <div>
                <div className="label-mono" style={{ fontWeight: 700, color: "var(--ink)" }}>
                  Comparison Settings: Direct Quotes &amp; Conceptual Overlap
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                  Flags exact matching passages and paraphrased claims compared against course readings and peer essays.
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--ink)",
                padding: "4px 10px",
                borderRadius: "2px",
              }}
              className="label-mono"
            >
              <span>PRESET:</span>
              <span style={{ fontWeight: 700, color: "var(--accent)" }}>ACADEMIC_STANDARD_v2</span>
            </div>
          </div>

          {/* Pairwise Limit Guard */}
          <div
            style={{
              padding: "14px 18px",
              backgroundColor: isPairExceeded ? "#FFF0F0" : "var(--surface)",
              border: "1px solid var(--ink)",
              borderRadius: "2px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div>
              <div className="caption-mono text-muted" style={{ fontWeight: 700, textTransform: "uppercase" }}>
                Pairwise Comparison Guard (MAX_PAIRS = {MAX_PAIRS})
              </div>
              <div style={{ fontSize: "13px", marginTop: "2px" }}>
                {submissionCount} papers yield <strong>{pairCount} unique comparisons</strong> [formula: n(n-1)/2].
              </div>
            </div>

            <span
              className={`tag ${isPairExceeded ? "tag-conflict" : "tag-same_facts"}`}
              style={{ fontWeight: 700 }}
            >
              {isPairExceeded
                ? `Limit Exceeded (${pairCount} > ${MAX_PAIRS})`
                : `${pairCount} / ${MAX_PAIRS} Pairs Allowed`}
            </span>
          </div>

          {/* Action Section */}
          <div
            style={{
              paddingTop: "20px",
              borderTop: "1px solid var(--ink)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--muted)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                lock
              </span>
              <span className="label-mono">Synthetic or authorised data only</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <Link
                href="/"
                className="btn btn-secondary"
                style={{ padding: "10px 20px", textDecoration: "none" }}
              >
                Save draft batch
              </Link>

              <button
                type="submit"
                disabled={submitting || isPairExceeded || submissions.length < 2}
                className="btn btn-primary"
                style={{
                  padding: "10px 24px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                id="start-analysis-btn"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                      autorenew
                    </span>
                    <span>Allocating runner...</span>
                  </>
                ) : (
                  <>
                    <span>Start analysis</span>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                      arrow_forward
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
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
