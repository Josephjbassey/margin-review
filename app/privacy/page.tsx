import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy & FERPA Compliance · Margin",
  description:
    "FERPA student isolation, data minimization, and human-in-the-loop ethical AI policy.",
};

export default function PrivacyPage() {
  return (
    <div className="content-container" style={{ paddingTop: "40px", paddingBottom: "120px" }}>
      <div style={{ marginBottom: "32px" }}>
        <Link
          href="/"
          style={{
            fontSize: "14px",
            fontFamily: "var(--font-mono)",
            color: "var(--accent)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "16px",
          }}
        >
          ← Return to Batches
        </Link>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
          <span className="tag tag-supported">FERPA COMPLIANT</span>
          <span className="tag tag-in-review">DATA ISOLATION PROTOCOL</span>
        </div>
        <h1 className="page-title" style={{ fontSize: "44px" }}>
          Privacy, Compliance & Ethics
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "18px", maxWidth: "800px" }}>
          How Margin protects student records under FERPA, guarantees intra-cohort data isolation,
          and ensures algorithmic decisions remain strictly human-driven.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", maxWidth: "900px" }}>
        {/* Section 1 */}
        <div className="card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                background: "var(--ink)",
                color: "var(--paper)",
                padding: "2px 8px",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              01
            </span>
            <h2 className="card-title" style={{ margin: 0 }}>
              FERPA Student Isolation & Ephemeral PII Stripping
            </h2>
          </div>
          <p style={{ color: "var(--ink)", lineHeight: 1.7, margin: 0 }}>
            Under the Family Educational Rights and Privacy Act (FERPA, 20 U.S.C. § 1232g), student
            educational records and personally identifiable information (PII) must be shielded from
            unauthorized disclosure. When a batch is analyzed, <strong>Automated PII Stripping</strong>
            immediately identifies and scrubs student names, matriculation numbers, institution emails, and personal identifiers.
            Subsequent steps—including pairwise comparison, claim grounding, and reviewer displays—strictly consume <code>masked_text</code>.
          </p>
        </div>

        {/* Section 2 */}
        <div className="card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                background: "var(--ink)",
                color: "var(--paper)",
                padding: "2px 8px",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              02
            </span>
            <h2 className="card-title" style={{ margin: 0 }}>
              Intra-Cohort Boundary (No Internet Scraping / No Essay Mills)
            </h2>
          </div>
          <p style={{ color: "var(--ink)", lineHeight: 1.7, margin: 0 }}>
            Margin is <strong>NOT</strong> an internet-wide plagiarism scanner. Submissions are compared solely against other
            manuscripts within the same instructor-uploaded cohort batch and grounded against assigned syllabus documents. Student
            writing is never contributed to public corpora, never used to train external LLMs, and never exposed to outside third parties.
          </p>
        </div>

        {/* Section 3 */}
        <div className="card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                background: "var(--ink)",
                color: "var(--paper)",
                padding: "2px 8px",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              03
            </span>
            <h2 className="card-title" style={{ margin: 0 }}>
              Human-in-the-Loop Guarantee (Zero Automated Penalties)
            </h2>
          </div>
          <p style={{ color: "var(--ink)", lineHeight: 1.7, margin: 0 }}>
            Margin flags evidence; <strong>it never issues automated verdicts, penalties, or disciplinary sanctions</strong>.
            AI systems are susceptible to context misinterpretation, especially regarding standard technical definitions,
            boilerplate assignment instructions, and valid collaborative templates. Every flagged contradiction or unsupported
            claim requires a verified instructor decision (Dismiss, Common Source, or Flag for Discussion) accompanied by an audit note.
          </p>
        </div>

        {/* Section 4 */}
        <div className="card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                background: "var(--ink)",
                color: "var(--paper)",
                padding: "2px 8px",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              04
            </span>
            <h2 className="card-title" style={{ margin: 0 }}>
              Data Deletion & Right to Be Forgotten
            </h2>
          </div>
          <p style={{ color: "var(--ink)", lineHeight: 1.7, margin: 0 }}>
            Educational institutions retain sovereign ownership of their data. Instructors may purge any batch, its submissions,
            and associated audit logs at any time. When a batch is deleted, all raw and masked text records are permanently removed
            from the Neon PostgreSQL database and cached disk entries.
          </p>
        </div>

        {/* Section 5 */}
        <div className="card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                background: "var(--ink)",
                color: "var(--paper)",
                padding: "2px 8px",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              05
            </span>
            <h2 className="card-title" style={{ margin: 0 }}>
              Deterministic Caching & Security Hygiene
            </h2>
          </div>
          <p style={{ color: "var(--ink)", lineHeight: 1.7, margin: 0 }}>
            API calls are cached using cryptographic SHA-256 hashes of canonicalized request bodies. API keys are strictly loaded
            from environment variables and never logged or exposed to the client browser. No tracking cookies, third-party advertising
            pixels, or analytics scripts are loaded.
          </p>
        </div>
      </div>

      <div style={{ marginTop: "40px" }}>
        <Link href="/" className="btn btn-primary" style={{ textDecoration: "none" }}>
          ← Back to Review Console
        </Link>
      </div>
    </div>
  );
}
