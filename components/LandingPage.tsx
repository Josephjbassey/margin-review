"use client";

import { useState } from "react";
import Link from "next/link";

export function LandingPage() {
  const [judgeLoading, setJudgeLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"contradiction" | "grounding">("contradiction");

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
    <div className="content-container" style={{ paddingTop: "32px", paddingBottom: "120px" }}>
      {/* 1. HERO SECTION */}
      <section style={{ marginBottom: "56px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
          <span className="tag tag-in-review" style={{ fontWeight: 700 }}>
            ACADEMIC FORENSIC ENGINE
          </span>
          <span className="tag tag-supported">FERPA COMPLIANT</span>
          <span className="tag tag-draft">CLOCKED CHALLENGE 2026</span>
        </div>

        <h1
          className="page-title"
          style={{
            fontSize: "50px",
            lineHeight: 1.08,
            maxWidth: "960px",
            marginBottom: "18px",
          }}
        >
          Forensic Manuscript Review For University Lecturers
        </h1>

        <p
          style={{
            fontSize: "19px",
            lineHeight: 1.6,
            color: "var(--muted)",
            maxWidth: "840px",
            marginBottom: "28px",
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
            marginBottom: "32px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <span style={{ fontSize: "24px" }}>⚖️</span>
          <div style={{ fontSize: "14px", lineHeight: 1.5 }}>
            <strong style={{ color: "var(--ink)" }}>Core Operating Principle:</strong> Margin flags evidence;{" "}
            <strong>it never issues automated verdicts or penalties</strong>. It is strictly NOT an internet-wide
            plagiarism scanner.
          </div>
        </div>

        {/* Hero Actions */}
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
            {judgeLoading ? "Entering Judge Mode..." : "Launch Review Console (1-Click Judge Access)"}
          </button>

          <a
            href="#case-studies"
            className="btn btn-secondary"
            style={{
              padding: "12px 20px",
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            Inspect Interactive Case Studies ↓
          </a>
        </div>
      </section>

      {/* 2. LIVE FORENSIC CASE STUDY SPOTLIGHT */}
      <section id="case-studies" style={{ marginBottom: "64px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <span className="caption-mono text-muted">SYNTHETIC COHORT SPOTLIGHT · GNS102</span>
            <h2 className="section-title" style={{ fontSize: "28px", margin: "4px 0 0 0" }}>
              What Clocked Actually Catches (That Internet Scanners Miss)
            </h2>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setActiveTab("contradiction")}
              className={`btn btn-sm ${activeTab === "contradiction" ? "btn-dark" : "btn-secondary"}`}
            >
              1. Empirical Contradiction
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("grounding")}
              className={`btn btn-sm ${activeTab === "grounding" ? "btn-dark" : "btn-secondary"}`}
            >
              2. Ungrounded Claim
            </button>
          </div>
        </div>

        {activeTab === "contradiction" ? (
          <div className="card" style={{ padding: "24px", background: "var(--surface)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="tag tag-conflict" style={{ fontWeight: 700 }}>
                  PAIR FINDING: CONFLICT (94% CONFIDENCE)
                </span>
                <span className="label-mono" style={{ fontSize: "14px", fontWeight: 700 }}>
                  Submission S-01 vs Submission S-02
                </span>
              </div>
              <span className="caption-mono text-muted">Endpoint: POST /clocked/compare</span>
            </div>

            <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              Two students submitted laboratory write-ups on the exact same benchmark suite. An internet plagiarism scanner
              ignores this because the surrounding prose is rewritten. Clocked Compare isolates the numerical factual contradiction:
            </p>

            <div className="manuscripts-grid" style={{ marginBottom: "20px" }}>
              <div style={{ background: "var(--paper)", padding: "16px", border: "1px solid var(--ink)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span className="caption-mono tag tag-draft">S-01 (Alice Vance)</span>
                  <span className="caption-mono text-muted">Masked Text</span>
                </div>
                <div style={{ fontSize: "13px", lineHeight: 1.6, fontFamily: "var(--font-inter)" }}>
                  The transition system under study was modeled using generalized Büchi automata. During benchmark execution on the Alpha suite,{" "}
                  <mark className="evidence-highlight" style={{ fontWeight: 700 }}>
                    the state-space search converged within exactly 45 iterations
                  </mark>
                  , confirming optimal bounded exploration.
                </div>
              </div>

              <div style={{ background: "var(--paper)", padding: "16px", border: "1px solid var(--ink)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span className="caption-mono tag tag-draft">S-02 (Bob Wright)</span>
                  <span className="caption-mono text-muted">Masked Text</span>
                </div>
                <div style={{ fontSize: "13px", lineHeight: 1.6, fontFamily: "var(--font-inter)" }}>
                  In our implementation, automata generation followed the standard LTL tableau expansion. When benchmarking against the Alpha test cases,{" "}
                  <mark className="evidence-highlight" style={{ fontWeight: 700 }}>
                    convergence required 120 iterative cycles before termination
                  </mark>
                  , indicating severe state-explosion resistance.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderTop: "1px dashed var(--track)", paddingTop: "14px" }}>
              <span className="label-mono" style={{ fontSize: "12px", color: "var(--ink)" }}>
                Lecturer Action in Console:
              </span>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span className="btn btn-sm btn-secondary" style={{ pointerEvents: "none", opacity: 0.85 }}>
                  Dismiss (Unrelated)
                </span>
                <span className="btn btn-sm btn-secondary" style={{ pointerEvents: "none", opacity: 0.85 }}>
                  Common Template
                </span>
                <span className="btn btn-sm btn-dark" style={{ pointerEvents: "none", fontWeight: 700 }}>
                  🚩 Flag for Discussion (Recorded)
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: "24px", background: "var(--surface)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="tag tag-conflict" style={{ fontWeight: 700 }}>
                  CLAIM STATUS: UNSUPPORTED
                </span>
                <span className="label-mono" style={{ fontSize: "14px", fontWeight: 700 }}>
                  Submission S-07 · Extracted Thesis Statement
                </span>
              </div>
              <span className="caption-mono text-muted">Endpoint: POST /clocked/grounding</span>
            </div>

            <div style={{ background: "#FFF6F6", border: "1px solid #D9383A", padding: "16px", marginBottom: "18px" }}>
              <div className="caption-mono" style={{ color: "#D9383A", fontWeight: 700, marginBottom: "4px" }}>
                EXTRACTED STUDENT CLAIM:
              </div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", lineHeight: 1.5 }}>
                "Recent advancements demonstrate that quantum teleportation circuits accelerate classical Büchi state-space exploration queries by polynomial factors."
              </div>
            </div>

            <div style={{ background: "var(--paper)", border: "1px solid var(--ink)", padding: "16px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span className="caption-mono tag tag-draft">CLOCKED RERANK CITATION EVALUATION</span>
                <span className="caption-mono text-muted">Reading Pack: Chapters 4 & 7</span>
              </div>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--muted)", margin: 0 }}>
                <strong>Model Finding:</strong> Syllabus documents cover Bounded Model Checking, SAT Solvers, and Partial Order Reduction.
                Neither assigned chapter substantiates quantum teleportation in classical verification. Rank 1 passage skipped (action: <code>skip</code>, reason: <code>unrelated_theory</code>).
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderTop: "1px dashed var(--track)", paddingTop: "14px" }}>
              <span className="label-mono" style={{ fontSize: "12px", color: "var(--ink)" }}>
                Lecturer Action in Console:
              </span>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span className="btn btn-sm btn-secondary" style={{ pointerEvents: "none", opacity: 0.85 }}>
                  Accept (Routine)
                </span>
                <span className="btn btn-sm btn-dark" style={{ pointerEvents: "none", fontWeight: 700 }}>
                  Ask Student to Cite (Recorded)
                </span>
                <span className="btn btn-sm btn-secondary" style={{ pointerEvents: "none", opacity: 0.85 }}>
                  🚩 Flag for Follow-up
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. THE 4-STEP FORENSIC PIPELINE */}
      <section style={{ marginBottom: "64px" }}>
        <div style={{ marginBottom: "24px" }}>
          <span className="caption-mono text-muted">INTRA-COHORT REVIEW WORKFLOW</span>
          <h2 className="section-title" style={{ fontSize: "28px", marginTop: "4px" }}>
            How Margin Evaluates a Student Cohort
          </h2>
          <p className="text-muted" style={{ margin: 0, fontSize: "15px", maxWidth: "680px" }}>
            Every manuscript runs through a deterministic 4-endpoint Clocked pipeline before presentation in the review console.
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
              <h3 className="card-title" style={{ fontSize: "17px", marginBottom: "8px" }}>
                PII Masking & Anonymization
              </h3>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--ink)", margin: 0 }}>
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
              <h3 className="card-title" style={{ fontSize: "17px", marginBottom: "8px" }}>
                Pairwise Alignment & Conflicts
              </h3>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--ink)", margin: 0 }}>
                Compares all $n(n-1)/2$ cohort pairs. Identifies shared factual claims, near-duplicate text, and
                contradictory empirical statements. <strong>Contradictions are sorted first</strong>.
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
              <h3 className="card-title" style={{ fontSize: "17px", marginBottom: "8px" }}>
                Grounded Claim Verification
              </h3>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--ink)", margin: 0 }}>
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
              <h3 className="card-title" style={{ fontSize: "17px", marginBottom: "8px" }}>
                Contextual Citation Reranking
              </h3>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--ink)", margin: 0 }}>
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

      {/* 4. COMPARISON: MARGIN VS GENERIC PLAGIARISM CHECKERS */}
      <section style={{ marginBottom: "64px" }}>
        <div style={{ marginBottom: "20px" }}>
          <span className="caption-mono text-muted">PARADIGM SHIFT</span>
          <h2 className="section-title" style={{ fontSize: "28px", marginTop: "4px" }}>
            Why Margin is NOT Internet Plagiarism Software
          </h2>
          <p className="text-muted" style={{ margin: 0, fontSize: "15px" }}>
            Commercial web scrapers treat student essays as public training data. Margin is an evidentiary forensic tool.
          </p>
        </div>

        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "var(--paper)", borderBottom: "2px solid var(--ink)" }}>
                <th style={{ padding: "12px 18px", fontFamily: "var(--font-mono)", fontSize: "11px" }}>FEATURE</th>
                <th style={{ padding: "12px 18px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)" }}>
                  COMMERCIAL WEB SCANNERS (Turnitin, etc.)
                </th>
                <th style={{ padding: "12px 18px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent)" }}>
                  MARGIN (Clocked Challenge 2026)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--track)" }}>
                <td style={{ padding: "12px 18px", fontWeight: 700 }}>Data Scope</td>
                <td style={{ padding: "12px 18px", color: "var(--muted)" }}>Internet web crawlers, external essay mills</td>
                <td style={{ padding: "12px 18px", fontWeight: 600 }}>Closed intra-cohort boundary & course syllabus</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--track)" }}>
                <td style={{ padding: "12px 18px", fontWeight: 700 }}>Student PII</td>
                <td style={{ padding: "12px 18px", color: "var(--muted)" }}>Stored indefinitely in central databases</td>
                <td style={{ padding: "12px 18px", fontWeight: 600 }}>Masked immediately via Clocked Protect (FERPA)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--track)" }}>
                <td style={{ padding: "12px 18px", fontWeight: 700 }}>Factual Contradictions</td>
                <td style={{ padding: "12px 18px", color: "var(--muted)" }}>Blind to semantic conflicts between essays</td>
                <td style={{ padding: "12px 18px", fontWeight: 600 }}>Flags opposing empirical numbers and claims</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--track)" }}>
                <td style={{ padding: "12px 18px", fontWeight: 700 }}>Decision Making</td>
                <td style={{ padding: "12px 18px", color: "var(--muted)" }}>Issues automated "similarity %" verdicts</td>
                <td style={{ padding: "12px 18px", fontWeight: 600 }}>Highlights evidence for human lecturer audit</td>
              </tr>
              <tr>
                <td style={{ padding: "12px 18px", fontWeight: 700 }}>Data Retention</td>
                <td style={{ padding: "12px 18px", color: "var(--muted)" }}>Retained by proprietary third-party servers</td>
                <td style={{ padding: "12px 18px", fontWeight: 600 }}>Permanently deleted when instructor purges batch</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. ARCHITECTURE & SPECIFICATIONS BENTO */}
      <section style={{ marginBottom: "64px" }}>
        <div style={{ marginBottom: "20px" }}>
          <span className="caption-mono text-muted">ENGINEERING BENCHMARKS</span>
          <h2 className="section-title" style={{ fontSize: "28px", margin: "4px 0 0 0" }}>
            Production Architecture & Constraints
          </h2>
        </div>

        <div className="bento-grid">
          <div className="card">
            <div className="caption-mono text-muted">CONCURRENCY & RATE LIMITING</div>
            <div style={{ fontSize: "28px", fontWeight: 700, margin: "8px 0", color: "var(--ink)" }}>
              4-Worker Pool
            </div>
            <div style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--muted)" }}>
              Capped with <code>p-limit</code> and automatic exponential backoff jitter on HTTP 429 and 5xx responses.
            </div>
          </div>

          <div className="card">
            <div className="caption-mono text-muted">CREDIT USE GUARD</div>
            <div style={{ fontSize: "28px", fontWeight: 700, margin: "8px 0", color: "var(--accent)" }}>
              MAX_PAIRS Guard
            </div>
            <div style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--muted)" }}>
              Guards against $O(n^2)$ combinatorial explosion ($n(n-1)/2$). Cohorts exceeding limit are refused.
            </div>
          </div>

          <div className="card">
            <div className="caption-mono text-muted">DETERMINISTIC DISK CACHE</div>
            <div style={{ fontSize: "28px", fontWeight: 700, margin: "8px 0", color: "var(--ink)" }}>
              SHA-256 Hashes
            </div>
            <div style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--muted)" }}>
              Cached on canonicalized JSON keys. Identical requests consume zero API credits. Errors never cached.
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer
        style={{
          marginTop: "40px",
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
