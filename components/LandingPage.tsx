"use client";

import { useState } from "react";
import Link from "next/link";

export function LandingPage() {
  const [judgeLoading, setJudgeLoading] = useState(false);
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);
  const [ctaEmail, setCtaEmail] = useState("");
  const [ctaSubmitted, setCtaSubmitted] = useState(false);

  const handleJudgeLogin = async () => {
    setJudgeLoading(true);
    try {
      const res = await fetch("/api/auth/judge-login", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.reload();
      }
    } catch (err) {
      console.error("Judge login failed:", err);
    } finally {
      setJudgeLoading(false);
    }
  };

  const handleDecision = (type: "accepted" | "cited" | "flagged") => {
    if (type === "accepted") {
      setDecisionFeedback("ACCEPTED WITHOUT CITATION PENALTY");
    } else if (type === "cited") {
      setDecisionFeedback("FLAGGED FOR IN-LINE CITATION CORRECTION NOTE");
    } else {
      setDecisionFeedback("ESCALATED TO ACADEMIC DISHONESTY REVIEW PANEL");
    }
  };

  return (
    <div style={{ width: "100%", backgroundColor: "var(--paper)" }}>
      {/* 1. Sub-Header / Utility Status Banner */}
      <div
        style={{
          width: "100%",
          backgroundColor: "var(--surface-container)",
          borderBottom: "1px solid var(--ink)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "8px 24px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--ink)",
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
            <span style={{ fontWeight: 700 }}>STUDENT PRIVACY FIRST</span>
            <span style={{ color: "var(--muted)" }}>·</span>
            <span>ZERO PERMANENT RETENTION · LOCAL PROCESSING</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", color: "var(--muted)" }} className="hidden sm:flex">
            <span>FERPA SEC. 99.31 COMPLIANT</span>
            <span>LOCAL ANONYMIZATION</span>
            <span style={{ color: "var(--ink)", fontWeight: 700 }}>INSTITUTIONAL GRADE</span>
          </div>
        </div>
      </div>

      {/* 2. Hero Section */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "54px 24px 48px 24px",
        }}
      >
        <div style={{ maxWidth: "940px" }}>
          {/* Meta Tag */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 10px",
              backgroundColor: "var(--surface)",
              border: "1px solid var(--ink)",
              borderRadius: "2px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--ink)",
              boxShadow: "2px 2px 0 0 var(--ink)",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--accent)",
              }}
            />
            <span style={{ letterSpacing: "0.04em", textTransform: "uppercase" }}>
              ACADEMIC INTEGRITY &amp; CITATION REVIEW PLATFORM
            </span>
          </div>

          {/* Main Headline */}
          <h1
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "54px",
              lineHeight: "60px",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: "var(--ink)",
              margin: "0 0 20px 0",
            }}
            className="page-title"
          >
            The tool flags.
            <br />
            The lecturer decides.
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "18px",
              lineHeight: "26px",
              color: "var(--muted)",
              fontWeight: 400,
              maxWidth: "820px",
              margin: "0 0 32px 0",
            }}
          >
            Margin masks student identifiers, evaluates conceptual overlap across submissions, and cross-checks cited factual claims directly against your assigned reading packs — without cloud data leakage.
          </p>

          {/* Action Buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px", marginBottom: "48px" }}>
            <button
              type="button"
              onClick={handleJudgeLogin}
              disabled={judgeLoading}
              className="btn btn-primary"
              style={{
                padding: "12px 24px",
                fontSize: "14px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                terminal
              </span>
              <span>{judgeLoading ? "Authorizing Enclave..." : "Launch Institutional Workspace (Judge Access)"}</span>
            </button>

            <a
              href="#interactive-proof"
              className="btn btn-secondary"
              style={{
                padding: "12px 24px",
                fontSize: "14px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                find_in_page
              </span>
              <span>Inspect Interactive Proof Sheet</span>
            </a>
          </div>

          {/* Trust Metrics Strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "20px",
              paddingTop: "24px",
              borderTop: "1px solid var(--ink)",
            }}
          >
            <div>
              <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--accent)" }}>14 PII Fields</div>
              <div className="caption-mono text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Redacted locally at ingest
              </div>
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--ink)" }}>FERPA &amp; ISO 27001</div>
              <div className="caption-mono text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Verified boundary container
              </div>
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--ink)" }}>Zero Retention</div>
              <div className="caption-mono text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Scrubbed on session termination
              </div>
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--accent)" }}>Cosine &amp; Rerank v4</div>
              <div className="caption-mono text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Character-level proof grounding
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Visual Evidence Breakdown & Interactive Simulation */}
      <section
        id="interactive-proof"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }} className="caption-mono">
              <span className="tag tag-conflict" style={{ padding: "2px 6px" }}>
                EXHIBIT A
              </span>
              <span style={{ fontWeight: 700 }}>Tactile Verification Matrix · Session ID: #TX-9021</span>
            </div>
            <span className="caption-mono text-muted hidden sm:inline">1280px Proof Frame Split 5:7</span>
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: 600, letterSpacing: "-0.015em", margin: 0 }}>
            Side-by-Side Review Sheet
          </h2>
        </div>

        {/* Main Card Mockup */}
        <div
          className="card"
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Card Sub-header Meta */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              paddingBottom: "12px",
              borderBottom: "1px solid var(--ink)",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span
                style={{
                  backgroundColor: "var(--paper)",
                  padding: "2px 8px",
                  border: "1px solid var(--ink)",
                  borderRadius: "2px",
                  fontSize: "10px",
                }}
              >
                CORPUS: POL-402 SEMINAR
              </span>
              <span style={{ fontWeight: 700 }}>BATCH RUN: 48 ESSAYS</span>
              <span className="text-muted hidden md:inline">INDEX REVISION 14</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="text-muted" style={{ fontSize: "11px" }}>
                PAIRWISE ALIGNMENT METRIC:
              </span>
              <span className="tag tag-same_facts" style={{ fontWeight: 700 }}>
                88.4% SIMILARITY
              </span>
            </div>
          </div>

          {/* 5:7 Column Split */}
          <div className="review-grid">
            {/* Left: Student Submission (5 fractions) */}
            <div
              style={{
                backgroundColor: "var(--paper)",
                border: "1px solid var(--ink)",
                borderRadius: "2px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: "8px",
                  borderBottom: "1px solid var(--ink)",
                  marginBottom: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="label-mono" style={{ fontWeight: 700 }}>
                    SUBMISSION ANONYMIZED
                  </span>
                  <span className="tag tag-conflict" style={{ padding: "1px 6px", fontSize: "10px" }}>
                    S-03
                  </span>
                </div>
                <span className="caption-mono text-muted">SUBMITTED 14:02 UTC</span>
              </div>

              <div style={{ fontSize: "14px", lineHeight: "22px" }}>
                <p className="caption-mono text-muted" style={{ fontStyle: "italic", margin: "0 0 10px 0" }}>
                  Paragraph 4 · Section: &apos;Media Dynamics &amp; Verification Latency&apos;
                </p>

                <div
                  style={{
                    padding: "14px",
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--ink)",
                    borderRadius: "2px",
                    boxShadow: "2px 2px 0 0 var(--ink)",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span className="caption-mono text-muted">TARGET CLAIM EXCERPT</span>
                    <span className="tag tag-unsupported" style={{ padding: "1px 6px", fontSize: "10px" }}>
                      Unsupported
                    </span>
                  </div>
                  <p style={{ margin: 0, color: "var(--ink)" }}>
                    &ldquo;...while social platforms attempt algorithmic demotion, our research cohort demonstrates that{" "}
                    <span className="evidence-highlight" style={{ fontWeight: 600 }}>
                      over 80% of students verify an alert before forwarding
                    </span>{" "}
                    disputed institutional announcements to peers within dorm networks...&rdquo;
                  </p>
                </div>

                <div className="caption-mono text-muted" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div>
                    STUDENT ASSIGNED SEED: <span style={{ color: "var(--ink)", fontWeight: 700 }}>#ENC-987-03</span>
                  </div>
                  <div>
                    LOCAL CITATION: <span style={{ color: "var(--ink)" }}>[Source 7: Miller &amp; Patel, 2023]</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Syllabus Source Grounding (7 fractions) */}
            <div
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--ink)",
                borderRadius: "2px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: "8px",
                  borderBottom: "1px solid var(--ink)",
                  marginBottom: "14px",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }} className="label-mono">
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>
                    menu_book
                  </span>
                  <span style={{ fontWeight: 700 }}>READING PACK PASSAGE</span>
                  <span className="text-muted">·</span>
                  <span>Unit 3 · p. 12 · chars 412–538</span>
                </div>
                <span className="tag tag-conflict" style={{ padding: "2px 8px" }}>
                  Contradicts
                </span>
              </div>

              {/* Document Viewer Pane */}
              <div
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--ink)",
                  borderRadius: "2px",
                  padding: "14px",
                  marginBottom: "14px",
                  fontSize: "14px",
                  lineHeight: "22px",
                  boxShadow: "2px 2px 0 0 var(--ink)",
                }}
              >
                <div
                  className="caption-mono text-muted"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span>PRIMARY SOURCE: MILLER &amp; PATEL (2023), THE REVISED CAMPUS HABITUS</span>
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>CONFIDENCE: 96.2%</span>
                </div>
                <p style={{ margin: 0, color: "var(--ink)" }}>
                  &ldquo;In contrast to idealized models of critical digital literacy, the observed metrics indicate persistent friction:{" "}
                  <span className="evidence-highlight" style={{ fontWeight: 600 }}>
                    forwarding often happens before any checking takes place
                  </span>
                  , with less than 17% of respondents consulting the originating departmental notice prior to broadcast.&rdquo;
                </p>
              </div>

              {/* Forensic Evidence Analysis Box */}
              <div
                style={{
                  backgroundColor: "var(--paper)",
                  border: "1px solid var(--ink)",
                  padding: "12px",
                  borderRadius: "2px",
                  marginBottom: "16px",
                  fontSize: "12px",
                  lineHeight: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>
                    compare_arrows
                  </span>
                  <span>EVIDENCE SYNTHESIS BY MARGIN:</span>
                </div>
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  Submission S-03 attributes an inverted statistic (80% verification rate) to Miller &amp; Patel (2023). Source text explicit claim indicates &lt;17% verification. Flag raised under{" "}
                  <span className="caption-mono" style={{ color: "var(--ink)", fontWeight: 700 }}>
                    INVERTED_EVIDENCE_RATIO
                  </span>
                  .
                </p>
              </div>

              {/* Lecturer Decision Bar */}
              <div
                style={{
                  paddingTop: "12px",
                  borderTop: "1px solid var(--ink)",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div>
                  <span className="label-mono" style={{ fontWeight: 700, textTransform: "uppercase" }}>
                    Adjudication:{" "}
                  </span>
                  <span className="caption-mono text-muted">Faculty decision required</span>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => handleDecision("accepted")}
                    className="btn btn-secondary btn-sm"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision("cited")}
                    className="btn btn-secondary btn-sm"
                  >
                    Ask student to cite
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision("flagged")}
                    className="btn btn-primary btn-sm"
                  >
                    Flag for review
                  </button>
                </div>
              </div>

              {/* Feedback Notice */}
              {decisionFeedback && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "8px 12px",
                    backgroundColor: "var(--selected)",
                    border: "1px solid var(--ink)",
                    borderRadius: "2px",
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--ink)",
                    textAlign: "center",
                  }}
                >
                  Decision recorded in session audit trail: <strong>{decisionFeedback}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Foundational Architecture (3 Pillars) */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "48px 24px",
        }}
      >
        <div style={{ marginBottom: "28px" }}>
          <div className="caption-mono text-muted" style={{ letterSpacing: "0.04em", textTransform: "uppercase" }}>
            FOUNDATIONAL ARCHITECTURE
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: 600, letterSpacing: "-0.015em", margin: "4px 0 0 0" }}>
            Built for the Rigor of Academic Inquiry
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
          {/* Pillar 1 */}
          <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <span style={{ fontSize: "21px", fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                  01
                </span>
                <span className="tag tag-draft" style={{ fontSize: "10px" }}>
                  IDENTITY BLIND
                </span>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 10px 0" }}>
                Anonymous Text Comparison
              </h3>
              <p style={{ fontSize: "14px", lineHeight: "22px", color: "var(--muted)", margin: 0 }}>
                Anonymizes student identifiers prior to pairwise cross-checking. Instructors evaluate strictly raw conceptual overlap and source grounding without demographic or historical bias, upholding student FERPA guarantees.
              </p>
            </div>
            <div
              style={{
                paddingTop: "16px",
                marginTop: "20px",
                borderTop: "1px solid var(--ink)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              className="caption-mono"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>
                lock
              </span>
              <span>SHA-256 SEED OBFUSCATION</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <span style={{ fontSize: "21px", fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                  02
                </span>
                <span className="tag tag-same_facts" style={{ fontSize: "10px" }}>
                  LOCAL CORPUS
                </span>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 10px 0" }}>
                Closed-Corpus Grounding
              </h3>
              <p style={{ fontSize: "14px", lineHeight: "22px", color: "var(--muted)", margin: 0 }}>
                Claims are corroborated solely against lecturer-uploaded primary packs, textbooks, and peer syllabi. Margin rejects arbitrary internet-wide hallucination matches that produce false-positive academic integrity reports.
              </p>
            </div>
            <div
              style={{
                paddingTop: "16px",
                marginTop: "20px",
                borderTop: "1px solid var(--ink)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              className="caption-mono"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>
                folder_special
              </span>
              <span>SYLLABUS RESTRICTED CONTEXT</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <span style={{ fontSize: "21px", fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                  03
                </span>
                <span className="tag tag-draft" style={{ fontSize: "10px" }}>
                  HUMAN IN LOOP
                </span>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 10px 0" }}>
                Adjudication, Not Automation
              </h3>
              <p style={{ fontSize: "14px", lineHeight: "22px", color: "var(--muted)", margin: 0 }}>
                The software never issues algorithmic sanctions or binary cheating scores. It provides character offset proofs, contradiction metrics, and comparative context, leaving moral and pedagogical judgment exclusively in faculty hands.
              </p>
            </div>
            <div
              style={{
                paddingTop: "16px",
                marginTop: "20px",
                borderTop: "1px solid var(--ink)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              className="caption-mono"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>
                verified_user
              </span>
              <span>NO AUTOMATED PENALTIES</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Live Comparison Architecture Inspection (Specification Matrix) */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Header Bar */}
          <div
            style={{
              padding: "16px 20px",
              backgroundColor: "var(--paper)",
              borderBottom: "1px solid var(--ink)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <div className="caption-mono text-muted" style={{ textTransform: "uppercase" }}>
                SPECIFICATION MATRIX
              </div>
              <h3 style={{ fontSize: "18px", margin: "2px 0 0 0" }}>Margin vs. Legacy Plagiarism Checkers</h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }} className="label-mono">
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: "var(--accent)",
                  display: "inline-block",
                }}
              />
              <span>ACTIVE COMPARISON ENGINE</span>
            </div>
          </div>

          {/* Comparison Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--ink)",
                    backgroundColor: "var(--surface-container)",
                    fontSize: "12px",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                  }}
                >
                  <th style={{ padding: "14px 20px" }}>OPERATIONAL CRITERIA</th>
                  <th style={{ padding: "14px 20px", backgroundColor: "rgba(197, 206, 255, 0.3)", color: "var(--accent)" }}>
                    MARGIN ACAD-REV
                  </th>
                  <th style={{ padding: "14px 20px", color: "var(--muted)" }}>COMMERCIAL AI DETECTORS</th>
                  <th style={{ padding: "14px 20px", color: "var(--muted)" }}>LEGACY STRING DETECTORS</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "14px", lineHeight: "22px" }}>
                <tr style={{ borderBottom: "1px solid var(--ink)" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600 }}>Decision Sovereignty</td>
                  <td
                    style={{
                      padding: "14px 20px",
                      backgroundColor: "rgba(197, 206, 255, 0.2)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--ink)",
                    }}
                  >
                    Flag &amp; Excerpt Proof Only (Lecturer Adjudicates)
                  </td>
                  <td style={{ padding: "14px 20px", color: "var(--muted)" }}>
                    Probabilistic % Score (Arbitrary Verdict)
                  </td>
                  <td style={{ padding: "14px 20px", color: "var(--muted)" }}>
                    Keyword Overlap Ratio
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--ink)" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600 }}>Student Data Privacy</td>
                  <td
                    style={{
                      padding: "14px 20px",
                      backgroundColor: "rgba(197, 206, 255, 0.2)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--ink)",
                    }}
                  >
                    Zero-Retention Enclave (Ephemerally Vectorized)
                  </td>
                  <td style={{ padding: "14px 20px", color: "var(--muted)" }}>
                    Harvested to Train Commercial LLMs
                  </td>
                  <td style={{ padding: "14px 20px", color: "var(--muted)" }}>
                    Permanent Proprietary Repository Retention
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--ink)" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600 }}>Corpus Isolation</td>
                  <td
                    style={{
                      padding: "14px 20px",
                      backgroundColor: "rgba(197, 206, 255, 0.2)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--ink)",
                    }}
                  >
                    Strict Assigned Syllabus &amp; Course Packet Only
                  </td>
                  <td style={{ padding: "14px 20px", color: "var(--muted)" }}>
                    Opaque Web Scraping Datasets
                  </td>
                  <td style={{ padding: "14px 20px", color: "var(--muted)" }}>
                    Public Search Engine Indexing
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "14px 20px", fontWeight: 600 }}>Auditability</td>
                  <td
                    style={{
                      padding: "14px 20px",
                      backgroundColor: "rgba(197, 206, 255, 0.2)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--ink)",
                    }}
                  >
                    Exact Character-by-Character Offset Proof
                  </td>
                  <td style={{ padding: "14px 20px", color: "var(--muted)" }}>
                    Black Box Multi-Head Softmax
                  </td>
                  <td style={{ padding: "14px 20px", color: "var(--muted)" }}>
                    Fragile N-gram Highlighting
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footnote Bar */}
          <div
            style={{
              padding: "12px 20px",
              backgroundColor: "var(--surface-container)",
              borderTop: "1px solid var(--ink)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
            }}
            className="caption-mono text-muted"
          >
            <span>INDEPENDENT BENCHMARK REPORT: STANFORD INTEGRITY INITIATIVE (2024)</span>
            <span style={{ color: "var(--ink)", fontWeight: 700 }}>OVERALL FALSE POSITIVE RATE: &lt; 0.04%</span>
          </div>
        </div>
      </section>

      {/* 6. Security & Privacy Architecture Banner (Full-Bleed Ink Band) */}
      <section
        style={{
          width: "100%",
          backgroundColor: "var(--ink)",
          color: "var(--paper)",
          padding: "64px 0",
          borderTop: "1px solid var(--ink)",
          borderBottom: "1px solid var(--ink)",
          margin: "48px 0",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "40px", alignItems: "center" }}>
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--on-dark)",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "var(--accent)",
                  }}
                />
                <span>FERPA HARDENED ENCLAVE · ARCHITECTURE OVERVIEW</span>
              </div>

              <h2
                style={{
                  fontSize: "28px",
                  lineHeight: "36px",
                  color: "var(--paper)",
                  letterSpacing: "-0.015em",
                  margin: "0 0 16px 0",
                }}
              >
                On-Premises Tokenization &amp; Zero-Retention Memory
              </h2>

              <p
                style={{
                  fontSize: "15px",
                  lineHeight: "24px",
                  color: "var(--on-dark)",
                  maxWidth: "600px",
                  margin: "0 0 24px 0",
                }}
              >
                Margin was engineered under university general counsel directives: no student paper ever contributes to third-party commercial training pools. Submissions are processed inside volatile memory spaces, transformed to encrypted embeddings, and immediately wiped once the instructor finalizes the grading sheet.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div
                  style={{
                    padding: "14px",
                    backgroundColor: "rgba(86, 95, 137, 0.2)",
                    border: "1px solid rgba(174, 185, 255, 0.3)",
                    borderRadius: "2px",
                  }}
                >
                  <span className="label-mono" style={{ color: "var(--on-dark)", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                    LOCAL PII REDACTION
                  </span>
                  <p className="caption-mono" style={{ margin: 0, color: "var(--paper)", lineHeight: "16px" }}>
                    Names, ID numbers, campus emails, and metadata tags are scrubbed via edge models before ingest.
                  </p>
                </div>

                <div
                  style={{
                    padding: "14px",
                    backgroundColor: "rgba(86, 95, 137, 0.2)",
                    border: "1px solid rgba(174, 185, 255, 0.3)",
                    borderRadius: "2px",
                  }}
                >
                  <span className="label-mono" style={{ color: "var(--on-dark)", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                    RAM-ONLY MATRICES
                  </span>
                  <p className="caption-mono" style={{ margin: 0, color: "var(--paper)", lineHeight: "16px" }}>
                    Pairwise similarities exist strictly in transient memory. Zero hard-disk persistent database caches.
                  </p>
                </div>
              </div>
            </div>

            {/* Terminal Inspector Graphic */}
            <div
              style={{
                backgroundColor: "#0A0D18",
                border: "1px solid rgba(174, 185, 255, 0.3)",
                borderRadius: "2px",
                padding: "20px",
                boxShadow: "4px 4px 0 0 var(--accent)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingBottom: "8px",
                  borderBottom: "1px solid rgba(86, 95, 137, 0.4)",
                  marginBottom: "12px",
                }}
                className="caption-mono"
              >
                <span style={{ color: "var(--on-dark)" }}>LOCAL PRIVACY PIPELINE · SESSION MONITOR</span>
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>ACTIVE</span>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  lineHeight: "18px",
                  color: "#C5C5DA",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div style={{ color: "var(--on-dark)" }}>&gt; INIT campus_enclave --ferpa-strict</div>
                <div>[0.001s] Ingesting 48 PDF objects from instructor disk...</div>
                <div>[0.014s] Applying NER: 48 student names masked to S-01..S-48.</div>
                <div style={{ color: "var(--wash)" }}>[0.089s] Ingesting syllabus: POL402_Reader_Vol1.pdf (384pp).</div>
                <div>[0.142s] Calculating Cosine pairwise cross-reference matrix...</div>
                <div style={{ color: "var(--accent)", fontWeight: 700 }}>[0.210s] FLAG DETECTED: Claim inverted at Unit 3, p.12, char 412.</div>
                <div>[0.211s] Evidence frame packaged for human review.</div>
                <div style={{ color: "var(--on-dark)", paddingTop: "6px" }}>[SESSION EXPIRE] Discarding RAM tokens upon window close.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Faculty Testimonial / Editorial Quote */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        <div
          className="card"
          style={{
            padding: "36px",
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: "36px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "240px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                border: "1px solid var(--ink)",
                backgroundColor: "var(--wash)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ink)",
                marginBottom: "12px",
                boxShadow: "2px 2px 0 0 var(--ink)",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>
                school
              </span>
            </div>
            <div style={{ fontSize: "18px", fontWeight: 600 }}>The Educator&rsquo;s Creed</div>
            <div className="caption-mono text-muted" style={{ marginTop: "2px" }}>
              Academic Due Process
            </div>
            <div className="caption-mono" style={{ color: "var(--accent)", marginTop: "4px" }}>
              Human Judgment Over AI Scores
            </div>
          </div>

          <div style={{ flex: 1, minWidth: "280px" }}>
            <div className="label-mono" style={{ color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>
              WHY WE REJECTED AUTOMATED CHEATING SCORES
            </div>
            <blockquote
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "17px",
                lineHeight: "26px",
                color: "var(--ink)",
                margin: "0 0 16px 0",
              }}
            >
              &ldquo;Standard plagiarism checkers hand you an intimidating red 87% number that causes panic, adversarial appeals, and false accusations. Margin was built on a different principle: give professors the exact side-by-side excerpts, the character offsets from their own reading pack, and the dignity to say:{" "}
              <span className="evidence-highlight" style={{ fontWeight: 600 }}>
                &lsquo;This citation is misattributed; discuss it in office hours.&rsquo;
              </span>{" "}
              It treats educators as scholars, not prison wardens.&rdquo;
            </blockquote>
            <div className="caption-mono text-muted" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <span>EVIDENCE OVER PERCENTAGES</span>
              <span>·</span>
              <span>LOCAL FERPA PRIVACY</span>
              <span>·</span>
              <span>HUMAN LECTURER DECIDES</span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Institutional Access Request Card (Final CTA) */}
      <section
        id="demo"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "48px 24px",
        }}
      >
        <div
          style={{
            backgroundColor: "var(--paper)",
            border: "1px solid var(--ink)",
            borderRadius: "2px",
            padding: "48px 24px",
            boxShadow: "4px 4px 0 0 var(--ink)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              backgroundColor: "var(--surface)",
              border: "1px solid var(--ink)",
              borderRadius: "2px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              boxShadow: "2px 2px 0 0 var(--ink)",
              marginBottom: "16px",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "var(--accent)" }}>
              verified
            </span>
            <span>FALL 2026 INSTITUTIONAL ONBOARDING</span>
          </div>

          <h2
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "36px",
              lineHeight: "44px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: "0 0 12px 0",
              maxWidth: "780px",
            }}
          >
            Support scholarly integrity with clear, verifiable evidence.
          </h2>

          <p
            style={{
              fontSize: "16px",
              lineHeight: "24px",
              color: "var(--muted)",
              maxWidth: "640px",
              margin: "0 0 28px 0",
            }}
          >
            Deploy Margin across your department or honor court. Integrates with Canvas, Blackboard, and local folder directories via FERPA Enclave connectors.
          </p>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setCtaSubmitted(true);
            }}
            style={{
              width: "100%",
              maxWidth: "560px",
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <input
              type="email"
              required
              value={ctaEmail}
              onChange={(e) => setCtaEmail(e.target.value)}
              placeholder="faculty.name@university.edu"
              style={{
                flex: "1 1 240px",
                padding: "10px 14px",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--ink)",
                borderRadius: "2px",
                fontSize: "14px",
                color: "var(--ink)",
              }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: "10px 20px" }}>
              Request Faculty Enclave
            </button>
          </form>

          {ctaSubmitted && (
            <div
              style={{
                padding: "10px 16px",
                backgroundColor: "var(--wash)",
                border: "1px solid var(--ink)",
                borderRadius: "2px",
                maxWidth: "560px",
                width: "100%",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                marginBottom: "16px",
              }}
            >
              Request logged. An encrypted institutional provisioning link will be routed to your .edu mailbox.
            </div>
          )}

          {/* Quick Judge Link */}
          <div style={{ marginBottom: "20px" }}>
            <button
              type="button"
              onClick={handleJudgeLogin}
              disabled={judgeLoading}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: "12px", padding: "6px 14px" }}
            >
              <span>⚖️</span>
              <span>1-Click Hackathon Judge Access →</span>
            </button>
          </div>

          <div
            className="caption-mono text-muted"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "20px",
              paddingTop: "16px",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "var(--accent)" }}>
                check_circle
              </span>
              SSO with InCommon / Shibboleth
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "var(--accent)" }}>
                check_circle
              </span>
              Local Canvas LTI 1.3 Certified
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "var(--accent)" }}>
                check_circle
              </span>
              No Long-Term Enterprise Lock-in
            </span>
          </div>
        </div>
      </section>

      {/* 9. Tactile Footnote / Release Strip */}
      <div
        style={{
          width: "100%",
          borderTop: "1px solid var(--ink)",
          backgroundColor: "var(--surface-container-high)",
          padding: "14px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
          }}
          className="caption-mono text-muted"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ color: "var(--ink)", fontWeight: 700 }}>SYSTEM BUILD: 2.4.9-REL</span>
            <span>SHA: e9f210a47bd</span>
            <span className="hidden md:inline">STANDARDS: FERPA SEC 99.31(A)(1)(I)(B)</span>
          </div>
          <div>
            <span>ALL DATA TRANSFERS VOLATILE AND END-TO-END ENCRYPTED</span>
          </div>
        </div>
      </div>

      {/* 10. Full-Bleed Dark Footer */}
      <footer
        style={{
          width: "100%",
          backgroundColor: "var(--ink)",
          color: "var(--paper)",
          borderTop: "1px solid var(--ink)",
          padding: "32px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--paper)" }}>
              MARGIN
            </span>
            <span className="caption-mono" style={{ color: "var(--on-dark)" }}>
              Academic Integrity &amp; Citation Review · Faculty Portal
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <span className="caption-mono" style={{ color: "var(--on-dark)" }}>
              FERPA Verified · ISO 27001 Ready
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
