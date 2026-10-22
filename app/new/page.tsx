"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const MAX_PAIRS = 20;

export default function NewBatchPage() {
  const router = useRouter();
  const [name, setName] = useState("GNS102 Informatics & Formal Methods");
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
      setName("GNS102 Informatics & Formal Methods (Autumn 2026)");
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

  return (
    <div className="container">
      {/* Top back link */}
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
          <h1 className="page-title" style={{ margin: 0 }}>
            New Review Batch
          </h1>
          <p className="text-muted" style={{ margin: "6px 0 0 0", fontSize: 16 }}>
            Upload student submissions and course reading pack. Identifiers are masked before pairwise
            comparison.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSample}
          disabled={loadingSample}
          className="btn btn-secondary"
        >
          {loadingSample ? "Staging..." : "⚡ Stage GNS102 Sample Files"}
        </button>
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
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Batch Name */}
        <div className="card" style={{ marginBottom: 24 }}>
          <label
            htmlFor="batchName"
            className="label-mono"
            style={{ display: "block", marginBottom: 8, fontWeight: 700 }}
          >
            BATCH NAME & COURSE
          </label>
          <input
            id="batchName"
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. GNS102 Formal Systems - Assignment 2"
          />
        </div>

        {/* Dual Upload Sections */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 24,
            marginBottom: 24,
          }}
        >
          {/* Dropzone 1: Student Submissions */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span className="label-mono" style={{ fontWeight: 700 }}>
                1. STUDENT SUBMISSIONS (.txt, .docx)
              </span>
              <span className="caption-mono tag tag-draft">
                {submissions.length} staged
              </span>
            </div>

            <label className="dropzone" style={{ display: "block" }}>
              <input
                type="file"
                multiple
                accept=".txt,.docx"
                onChange={handleSubmissionsUpload}
                style={{ display: "none" }}
              />
              <div style={{ fontSize: 24, marginBottom: 8 }}>📄</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                Drop student essays or click to browse
              </div>
              <div className="caption-mono text-muted">
                Each manuscript receives an anonymous sequential label (S-01, S-02...)
              </div>
            </label>

            {submissions.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  maxHeight: 220,
                  overflowY: "auto",
                  border: "1px solid var(--ink)",
                  backgroundColor: "var(--paper)",
                }}
              >
                {submissions.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "8px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid rgba(16,20,38,0.1)",
                    }}
                  >
                    <div>
                      <span className="caption-mono tag tag-draft" style={{ marginRight: 8 }}>
                        S-0{i + 1}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{f.name}</span>
                      <span className="caption-mono text-muted" style={{ marginLeft: 8 }}>
                        ({(f.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSubmission(i)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--muted)",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dropzone 2: Course Reading Pack */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span className="label-mono" style={{ fontWeight: 700 }}>
                2. COURSE READING PACK (.txt, .docx)
              </span>
              <span className="caption-mono tag tag-draft">
                {readingPack.length} staged
              </span>
            </div>

            <label className="dropzone" style={{ display: "block" }}>
              <input
                type="file"
                multiple
                accept=".txt,.docx"
                onChange={handleReadingUpload}
                style={{ display: "none" }}
              />
              <div style={{ fontSize: 24, marginBottom: 8 }}>📚</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                Drop textbook chapters or syllabus reading
              </div>
              <div className="caption-mono text-muted">
                Student claims are verified and grounded against this reference corpus
              </div>
            </label>

            {readingPack.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  maxHeight: 220,
                  overflowY: "auto",
                  border: "1px solid var(--ink)",
                  backgroundColor: "var(--paper)",
                }}
              >
                {readingPack.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "8px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid rgba(16,20,38,0.1)",
                    }}
                  >
                    <div>
                      <span className="caption-mono tag tag-draft" style={{ marginRight: 8 }}>
                        R-0{i + 1}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{f.name}</span>
                      <span className="caption-mono text-muted" style={{ marginLeft: 8 }}>
                        ({(f.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeReading(i)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--muted)",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pairwise Guard Card */}
        <div
          className="card"
          style={{
            marginBottom: 24,
            backgroundColor: isPairExceeded ? "#FFF0F0" : "var(--surface)",
            borderColor: isPairExceeded ? "#900" : "var(--ink)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="caption-mono text-muted" style={{ fontWeight: 700 }}>
                PAIRWISE COMPARISON GUARD (MAX_PAIRS = {MAX_PAIRS})
              </div>
              <div style={{ marginTop: 4, fontSize: 14 }}>
                {submissionCount} manuscripts yield{" "}
                <strong>{pairCount} unique pairs</strong> [formula: n(n-1)/2].
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

          {isPairExceeded && (
            <p className="caption-mono" style={{ color: "#900", margin: "10px 0 0 0" }}>
              Please remove submissions so that the pairwise combinations do not exceed the guard of {MAX_PAIRS}.
            </p>
          )}
        </div>

        {/* Submit Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 16 }}>
          <Link href="/" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || isPairExceeded || submissions.length < 2}
            className="btn btn-primary"
            style={{ minWidth: 160 }}
          >
            {submitting ? "Creating Batch..." : "Start Analysis →"}
          </button>
        </div>
      </form>
    </div>
  );
}
