import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Department Pricing & Submission Credits · Margin",
  description:
    "Predictable academic billing for university faculty, departments, and registrar offices. Prepaid submission credits with zero surprise overages.",
};

export default function PricingPage() {
  return (
    <div className="content-container" style={{ paddingTop: "40px", paddingBottom: "120px" }}>
      {/* Header & Breadcrumb */}
      <div style={{ marginBottom: "36px" }}>
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
          ← Return to Batches &amp; Overview
        </Link>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
          <span className="tag tag-supported">COMING SOON</span>
          <span className="tag tag-in-review">ACADEMIC PROCUREMENT READY</span>
        </div>
        <h1 className="page-title" style={{ fontSize: "40px", marginBottom: "12px" }}>
          Predictable Department Billing &amp; Institutional Licensing
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "18px", maxWidth: "820px", lineHeight: "26px", margin: 0 }}>
          Margin rejects arbitrary per-token surcharges and aggressive overage meters. Tailored for university
          procurement cycles, departmental P-cards, and grant funding with transparent prepaid submission credits.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
          alignItems: "stretch",
          marginBottom: "48px",
        }}
      >
        {/* Tier 1: Individual Pilot */}
        <div
          className="card"
          style={{
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "4px 4px 0 0 var(--ink)",
          }}
        >
          <div>
            <div className="caption-mono text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>
              Individual Pilot
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "6px" }}>
              <span style={{ fontSize: "36px", fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-inter)" }}>$0</span>
              <span className="caption-mono text-muted">/ Free for evaluation</span>
            </div>
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 24px 0", lineHeight: "20px" }}>
              For individual professors, seminar leaders, and honor court members evaluating Margin on a single course cohort.
            </p>

            <div style={{ borderTop: "1px solid var(--track)", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--accent)" }}>check</span>
                <span>Up to 20 paper comparisons per run</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--accent)" }}>check</span>
                <span>Direct PDF, Word &amp; Text ingestion</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--accent)" }}>check</span>
                <span>Side-by-side evidence inspection</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--accent)" }}>check</span>
                <span>Standard FERPA PII masking</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--accent)" }}>check</span>
                <span>Exportable Markdown audit records</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "32px" }}>
            <Link
              href="/login"
              className="btn btn-secondary"
              style={{ width: "100%", textDecoration: "none" }}
            >
              Start Free Pilot
            </Link>
          </div>
        </div>

        {/* Tier 2: Department Credit Packs */}
        <div
          className="card"
          style={{
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "6px 6px 0 0 var(--accent)",
            border: "2px solid var(--accent)",
            backgroundColor: "var(--surface)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-12px",
              right: "20px",
              backgroundColor: "var(--accent)",
              color: "#FFFFFF",
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "2px",
              letterSpacing: "0.04em",
            }}
          >
            RECOMMENDED FOR DEPARTMENTS
          </div>

          <div>
            <div className="caption-mono" style={{ color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>
              Department Credit Packs
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "6px" }}>
              <span style={{ fontSize: "36px", fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-inter)" }}>$49</span>
              <span className="caption-mono text-muted">/ 250 Submissions ($0.19/ea)</span>
            </div>
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 24px 0", lineHeight: "20px" }}>
              Prepaid submission bundles for collegiate academic departments. Credits never expire and roll over between semesters.
            </p>

            <div style={{ borderTop: "1px solid var(--track)", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--accent)" }}>check</span>
                <span><strong>No expiration date:</strong> Credits roll over</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--accent)" }}>check</span>
                <span>Multi-faculty pooled allocation</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--accent)" }}>check</span>
                <span>Priority Claim Verification &amp; Reranking</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--accent)" }}>check</span>
                <span>Department invoice &amp; P-Card receipts</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--accent)" }}>check</span>
                <span>Also available: <strong>1,000 papers for $149</strong> ($0.15/ea)</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "32px" }}>
            <button
              type="button"
              disabled
              className="btn btn-primary"
              style={{ width: "100%", opacity: 0.85, cursor: "not-allowed" }}
            >
              Order Credit Pack (Opening Q4 2026)
            </button>
          </div>
        </div>

        {/* Tier 3: Campus & Registrar License */}
        <div
          className="card"
          style={{
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "4px 4px 0 0 var(--ink)",
          }}
        >
          <div>
            <div className="caption-mono text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>
              Campus &amp; Registrar
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "6px" }}>
              <span style={{ fontSize: "36px", fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-inter)" }}>Site License</span>
              <span className="caption-mono text-muted">/ Annual</span>
            </div>
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 24px 0", lineHeight: "20px" }}>
              Full institutional deployment for university-wide honor courts, registrar offices, and academic computing divisions.
            </p>

            <div style={{ borderTop: "1px solid var(--track)", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--accent)" }}>check</span>
                <span><strong>Bring Your Own Key (BYOK):</strong> Zero markup</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--accent)" }}>check</span>
                <span>Unlimited student submissions</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--accent)" }}>check</span>
                <span>LMS LTI 1.3 (Canvas, Blackboard, Moodle)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--accent)" }}>check</span>
                <span>InCommon &amp; SAML 2.0 Single Sign-On</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--accent)" }}>check</span>
                <span>Custom FERPA Data Processing Agreement</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "32px" }}>
            <a
              href="mailto:procurement@margin.edu?subject=Institutional%20Inquiry%20-%20Margin%20Academic%20Integrity"
              className="btn btn-secondary"
              style={{ width: "100%", textDecoration: "none" }}
            >
              Contact University Liaison
            </a>
          </div>
        </div>
      </div>

      {/* Why This Monetization Model Fits Academia */}
      <div className="card" style={{ padding: "32px", marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              background: "var(--accent)",
              color: "#FFFFFF",
              padding: "2px 8px",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            ARCHITECTURE
          </span>
          <h2 className="card-title" style={{ margin: 0 }}>
            Why Prepaid Credits &amp; BYOK Over Affiliate Commissions
          </h2>
        </div>
        <p style={{ color: "var(--ink)", lineHeight: 1.7, marginBottom: "16px" }}>
          Universities do not operate on recurring metered credit cards. Department administrators and chairs
          require fixed, authorized purchase orders without unpredictable burst invoices at the end of term.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
          <div style={{ padding: "16px", backgroundColor: "var(--surface-container)", borderRadius: "2px" }}>
            <div className="label-mono" style={{ fontWeight: 700, marginBottom: "6px", color: "var(--accent)" }}>
              Prepaid Credit Packs
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: "18px" }}>
              Faculty purchase 250 or 1,000 submission vouchers via departmental P-card or grant funds. Credits never expire and rollover across academic years.
            </p>
          </div>
          <div style={{ padding: "16px", backgroundColor: "var(--surface-container)", borderRadius: "2px" }}>
            <div className="label-mono" style={{ fontWeight: 700, marginBottom: "6px", color: "var(--accent)" }}>
              Bring Your Own Key (BYOK)
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: "18px" }}>
              Enterprise campuses route inference through their existing institutional contracts with 0% margin markup, paying purely for Margin software seat licensing.
            </p>
          </div>
          <div style={{ padding: "16px", backgroundColor: "var(--surface-container)", borderRadius: "2px" }}>
            <div className="label-mono" style={{ fontWeight: 700, marginBottom: "6px", color: "var(--accent)" }}>
              Zero-Cost Cached Comparisons
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: "18px" }}>
              Pairwise n-gram shingles and primary reading pack indices are computed once. Repeated reviews and committee consultations consume zero additional credits.
            </p>
          </div>
        </div>
      </div>

      {/* University Procurement FAQ */}
      <div style={{ maxWidth: "900px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "20px" }}>
          Academic Procurement &amp; Licensing FAQ
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 8px 0" }}>
              Can we pay via University Purchase Order (PO) or net-30 invoicing?
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)", lineHeight: "20px" }}>
              Yes. Institutional licenses and Department Credit Packs above $500 support direct university purchase orders, W-9 provision, and Net-30 remittance.
            </p>
          </div>
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 8px 0" }}>
              Does Margin retain or train on student essays?
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)", lineHeight: "20px" }}>
              Strictly never. Student submissions are processed within ephemeral memory, stripped of PII via Clocked Protect, and never pooled into public corpora or training sets.
            </p>
          </div>
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 8px 0" }}>
              How does the free pilot work for single faculty members?
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)", lineHeight: "20px" }}>
              Sign in with your educational email address to immediately access full cohort comparisons for up to 20 papers with no credit card required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
