"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function LandingPage() {
  const router = useRouter();
  const [judgeLoading, setJudgeLoading] = useState(false);

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

  return (
    <div className="content-container" style={{ paddingTop: "40px", paddingBottom: "120px" }}>
      {/* 1. HERO SECTION */}
      <section style={{ marginBottom: "64px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
          <span className="tag tag-in-review" style={{ fontWeight: 700 }}>
            ACADEMIC INTEGRITY FORENSIC ENGINE
          </span>
          <span className="tag tag-supported">FERPA COMPLIANT</span>
          <span className="tag tag-draft">CLOCKED BUILD CHALLENGE 2026</span>
        </div>

        <h1
          className="page-title"
          style={{
            fontSize: "52px",
            lineHeight: 1.08,
            maxWidth: "960px",
            marginBottom: "20px",
          }}
        >
          Forensic Manuscript Review For University Lecturers
        </h1>

        <p
          style={{
            fontSize: "20px",
            lineHeight: 1.6,
            color: "var(--muted)",
            maxWidth: "840px",
            marginBottom: "32px",
          }}
        >
          Margin masks student identifiers, evaluates cohort submissions for shared or contradictory
          factual claims, checks statements against your reading pack, and presents highlighted evidence
          so a human lecturer decides.
        </p>

        {/* Motto Callout Banner */}
        <div
          style={{
            padding: "16px 20px",
            background: "var(--surface)",
            border: "1px solid var(--ink)",
            boxShadow: "var(--shadow-button)",
            maxWidth: "760px",
            marginBottom: "36px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <span style={{ fontSize: "24px" }}>⚖️</span>
          <div style={{ fontSize: "15px", lineHeight: 1.5 }}>
            <strong style={{ color: "var(--ink)" }}>Core Operating Principle:</strong> Margin flags evidence;{" "}
            <strong>it never issues automated verdicts or penalties</strong>. It is strictly NOT an internet-wide
            plagiarism scanner.
          </div>
        </div>

        {/* Hero Action Buttons */}
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleJudgeLogin}
            disabled={judgeLoading}
            className="btn btn-primary"
            style={{
              padding: "12px 24px",
              fontSize: "15px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>⚖️</span>
            {judgeLoading ? "Entering Judge Mode..." : "1-Click Judge Access"}
          </button>

          <Link
            href="/login"
            className="btn btn-secondary"
            style={{
              padding: "12px 24px",
              fontSize: "15px",
              textDecoration: "none",
            }}
          >
            Lecturer Sign In / Register →
          </Link>

          <Link
            href="/privacy"
            style={{
              fontSize: "14px",
              fontFamily: "var(--font-mono)",
              color: "var(--muted)",
              textDecoration: "underline",
              marginLeft: "8px",
            }}
          >
            FERPA & Privacy Architecture
          </Link>
        </div>
      </section>

      {/* 2. THE 5-STEP FORENSIC PIPELINE */}
      <section style={{ marginBottom: "72px" }}>
        <div style={{ marginBottom: "28px" }}>
          <span className="caption-mono text-muted">INTRA-COHORT REVIEW WORKFLOW</span>
          <h2 className="section-title" style={{ fontSize: "32px", marginTop: "4px" }}>
            How Margin Evaluates a Student Cohort
          </h2>
          <p className="text-muted" style={{ margin: 0, fontSize: "16px", maxWidth: "680px" }}>
            Every submission runs through a deterministic 4-endpoint Clocked pipeline before presentation in the review console.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
          {/* Step 1 */}
          <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span className="caption-mono tag tag-same_facts">STEP 1</span>
                <span className="caption-mono" style={{ color: "var(--accent)", fontWeight: 700 }}>
                  POST /clocked/pii
                </span>
              </div>
              <h3 className="card-title" style={{ fontSize: "18px", marginBottom: "8px" }}>
                PII Masking & Anonymization
              </h3>
              <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--ink)", margin: 0 }}>
                Names, matriculation numbers, and institution emails are stripped and replaced with anonymous tags
                (<code>&lt;PERSON&gt;</code>, <code>&lt;STUDENT_ID&gt;</code>). Only <code>masked_text</code> is forwarded
                to comparison models or displayed to reviewers.
              </p>
            </div>
            <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px dashed var(--track)" }}>
              <span className="caption-mono tag tag-supported">FERPA Student Isolation</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span className="caption-mono tag tag-conflict">STEP 2</span>
                <span className="caption-mono" style={{ color: "var(--accent)", fontWeight: 700 }}>
                  POST /clocked/compare
                </span>
              </div>
              <h3 className="card-title" style={{ fontSize: "18px", marginBottom: "8px" }}>
                Pairwise Alignment & Conflicts
              </h3>
              <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--ink)", margin: 0 }}>
                Compares all $n(n-1)/2$ cohort pairs. Identifies shared factual claims, near-duplicate text, and
                contradictory empirical statements (e.g. conflicting benchmark metrics). <strong>Contradictions are sorted first</strong>.
              </p>
            </div>
            <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px dashed var(--track)" }}>
              <span className="caption-mono tag tag-conflict">Conflicts Prioritized</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span className="caption-mono tag tag-same_facts">STEP 3</span>
                <span className="caption-mono" style={{ color: "var(--accent)", fontWeight: 700 }}>
                  POST /clocked/grounding
                </span>
              </div>
              <h3 className="card-title" style={{ fontSize: "18px", marginBottom: "8px" }}>
                Grounded Claim Verification
              </h3>
              <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--ink)", margin: 0 }}>
                Extracts thesis statements and empirical claims from each essay and tests them against the course reading pack.
                Categorizes statements as <em>Supported</em>, <em>Partial</em>, or <em>Unsupported</em>.
              </p>
            </div>
            <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px dashed var(--track)" }}>
              <span className="caption-mono tag tag-same_facts">Syllabus Grounding</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span className="caption-mono tag tag-draft">STEP 4</span>
                <span className="caption-mono" style={{ color: "var(--accent)", fontWeight: 700 }}>
                  POST /clocked/rerank
                </span>
              </div>
              <h3 className="card-title" style={{ fontSize: "18px", marginBottom: "8px" }}>
                Contextual Citation Reranking
              </h3>
              <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--ink)", margin: 0 }}>
                Triggered strictly for unsupported or partial claims: reranks syllabus passages independently and signals whether
                to use the excerpt, expand surrounding context, or skip.
              </p>
            </div>
            <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px dashed var(--track)" }}>
              <span className="caption-mono tag tag-in-review">Smart Citations</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMPARISON: MARGIN VS GENERIC PLAGIARISM CHECKERS */}
      <section style={{ marginBottom: "72px" }}>
        <div style={{ marginBottom: "24px" }}>
          <span className="caption-mono text-muted">PARADIGM SHIFT</span>
          <h2 className="section-title" style={{ fontSize: "32px", marginTop: "4px" }}>
            Why Margin is NOT Internet Plagiarism Software
          </h2>
          <p className="text-muted" style={{ margin: 0, fontSize: "16px" }}>
            Commercial web scrapers treat student essays as public training data. Margin is an evidentiary forensic tool.
          </p>
        </div>

        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "var(--paper)", borderBottom: "2px solid var(--ink)" }}>
                <th style={{ padding: "14px 18px", fontFamily: "var(--font-mono)", fontSize: "12px" }}>FEATURE</th>
                <th style={{ padding: "14px 18px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)" }}>
                  COMMERCIAL WEB SCANNERS (Turnitin, etc.)
                </th>
                <th style={{ padding: "14px 18px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent)" }}>
                  MARGIN (Clocked Challenge 2026)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--track)" }}>
                <td style={{ padding: "14px 18px", fontWeight: 700 }}>Data Scope</td>
                <td style={{ padding: "14px 18px", color: "var(--muted)" }}>Internet web crawlers, external essay mills</td>
                <td style={{ padding: "14px 18px", fontWeight: 600 }}>Closed intra-cohort boundary & course syllabus</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--track)" }}>
                <td style={{ padding: "14px 18px", fontWeight: 700 }}>Student PII</td>
                <td style={{ padding: "14px 18px", color: "var(--muted)" }}>Stored indefinitely in central databases</td>
                <td style={{ padding: "14px 18px", fontWeight: 600 }}>Masked immediately via Clocked Protect (FERPA)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--track)" }}>
                <td style={{ padding: "14px 18px", fontWeight: 700 }}>Factual Contradictions</td>
                <td style={{ padding: "14px 18px", color: "var(--muted)" }}>Blind to semantic conflicts between essays</td>
                <td style={{ padding: "14px 18px", fontWeight: 600 }}>Flags opposing empirical numbers and claims</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--track)" }}>
                <td style={{ padding: "14px 18px", fontWeight: 700 }}>Decision Making</td>
                <td style={{ padding: "14px 18px", color: "var(--muted)" }}>Issues automated "similarity %" verdicts</td>
                <td style={{ padding: "14px 18px", fontWeight: 600 }}>Highlights evidence for human lecturer audit</td>
              </tr>
              <tr>
                <td style={{ padding: "14px 18px", fontWeight: 700 }}>Data Retention</td>
                <td style={{ padding: "14px 18px", color: "var(--muted)" }}>Retained by proprietary third-party servers</td>
                <td style={{ padding: "14px 18px", fontWeight: 600 }}>Permanently deleted when instructor purges batch</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. JUDGE FAST-TRACK CALLOUT */}
      <section>
        <div
          className="card"
          style={{
            border: "2px solid var(--accent)",
            background: "var(--surface)",
            padding: "36px",
            boxShadow: "var(--shadow-modal)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "24px",
          }}
        >
          <div style={{ maxWidth: "600px" }}>
            <span className="caption-mono tag tag-in-review" style={{ marginBottom: "12px", display: "inline-block" }}>
              CLOCKED CHALLENGE JUDGING
            </span>
            <h2 className="section-title" style={{ fontSize: "28px", margin: "0 0 10px 0" }}>
              Evaluating Margin for the Clocked Hackathon?
            </h2>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "16px", lineHeight: 1.6 }}>
              Enter with 1-click Judge Mode to inspect the live pre-seeded <strong>GNS102 Informatics & Formal Methods</strong>{" "}
              cohort. Review real contradiction highlights, test the decision drawer, and export the Markdown audit report.
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={handleJudgeLogin}
              disabled={judgeLoading}
              className="btn btn-primary"
              style={{
                padding: "14px 28px",
                fontSize: "16px",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span>⚖️</span>
              {judgeLoading ? "Authorizing..." : "Launch Judge Review Console →"}
            </button>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer
        style={{
          marginTop: "80px",
          paddingTop: "24px",
          borderTop: "1px solid var(--track)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          fontSize: "13px",
          color: "var(--muted)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--ink)" }}>MARGIN</span>
          <span>· Academic Integrity Forensic System</span>
          <span>· © {new Date().getFullYear()}</span>
        </div>

        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>
            Flags overlap for human review · Never issues automated verdicts
          </span>
          <Link
            href="/privacy"
            style={{
              color: "var(--accent)",
              textDecoration: "underline",
              fontFamily: "var(--font-mono)",
            }}
          >
            FERPA & Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
