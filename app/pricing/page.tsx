"use client";

import { useState } from "react";
import Link from "next/link";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [cohortSize, setCohortSize] = useState<number>(30);
  const [papersPerStudent, setPapersPerStudent] = useState<number>(3);

  // Total papers across semester
  const totalPapers = cohortSize * papersPerStudent;
  // Estimated Clocked credits per paper: ~50 credits (PII Protect + Claim Grounding + Reranking)
  const estimatedCredits = totalPapers * 50;

  return (
    <div className="content-container" style={{ paddingTop: "40px", paddingBottom: "120px" }}>
      {/* Header & Breadcrumbs */}
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
          ← Return to Batches &amp; Overview
        </Link>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
          <span className="tag tag-supported">TRANSPARENT USAGE PRICING</span>
          <span className="tag tag-in-review">ACADEMIC DUE PROCESS</span>
        </div>
        <h1 className="page-title" style={{ fontSize: "38px", marginBottom: "12px" }}>
          Transparent Review Pricing &amp; Institutional Licensing
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "17px", maxWidth: "840px", lineHeight: "26px", margin: 0 }}>
          Predictable, scholar-friendly pricing tailored for university procurement cycles, grant budgets, and departmental expense cards.
          Choose between direct institutional account connectivity or turnkey semester bundles with zero hidden platform markups.
        </p>
      </div>

      {/* Monthly / Yearly Billing Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          marginBottom: "36px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            fontWeight: billingCycle === "monthly" ? 700 : 400,
            color: billingCycle === "monthly" ? "var(--ink)" : "var(--muted)",
          }}
        >
          Monthly Billing
        </span>
        <button
          type="button"
          onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
          style={{
            width: "52px",
            height: "28px",
            borderRadius: "14px",
            backgroundColor: billingCycle === "yearly" ? "var(--accent)" : "var(--ink)",
            border: "1px solid var(--ink)",
            cursor: "pointer",
            position: "relative",
            padding: "2px",
            transition: "background-color 0.2s ease",
          }}
          title="Toggle between monthly and yearly billing"
        >
          <div
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              backgroundColor: "#FFFFFF",
              transform: billingCycle === "yearly" ? "translateX(24px)" : "translateX(0px)",
              transition: "transform 0.2s ease",
            }}
          />
        </button>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            fontWeight: billingCycle === "yearly" ? 700 : 400,
            color: billingCycle === "yearly" ? "var(--ink)" : "var(--muted)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>Yearly Billing</span>
          <span
            style={{
              backgroundColor: "var(--wash)",
              color: "var(--accent)",
              border: "1px solid var(--accent)",
              fontSize: "11px",
              padding: "1px 6px",
              borderRadius: "2px",
              fontWeight: 700,
            }}
          >
            10% OFF + 10% MORE CREDITS
          </span>
        </span>
      </div>

      {/* 4 Official Clocked API Tiers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
          alignItems: "stretch",
          marginBottom: "48px",
        }}
      >
        {/* Tier 1: Explore (Free Trial) */}
        <div
          className="card"
          style={{
            padding: "28px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "4px 4px 0 0 var(--ink)",
          }}
        >
          <div>
            <div className="caption-mono text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>
              01 / Explore
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "4px" }}>
              <span style={{ fontSize: "32px", fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-inter)" }}>$0</span>
              <span className="caption-mono text-muted">Free trial</span>
            </div>
            <div className="caption-mono" style={{ color: "var(--accent)", fontWeight: 700, marginBottom: "8px" }}>
              4,000 credits once · No card
            </div>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 20px 0", lineHeight: "18px" }}>
              Try the full picture before committing. Covers about 4,000 decisions, 493 extractions, or 300 PII redactions.
            </p>

            <div style={{ borderTop: "1px solid var(--track)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>check</span>
                <span>4,000 credits one-time allowance</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>check</span>
                <span>Explore every published API</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>check</span>
                <span>One request at a time concurrency</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>check</span>
                <span>Never incurs paid overage</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "24px" }}>
            <Link
              href="/login"
              className="btn btn-secondary"
              style={{ width: "100%", padding: "10px", fontSize: "12px", textDecoration: "none", justifyContent: "center" }}
            >
              Start Free Trial
            </Link>
          </div>
        </div>

        {/* Tier 2: Build */}
        <div
          className="card"
          style={{
            padding: "28px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "4px 4px 0 0 var(--ink)",
          }}
        >
          <div>
            <div className="caption-mono text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>
              02 / Build
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "4px" }}>
              <span style={{ fontSize: "32px", fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-inter)" }}>
                {billingCycle === "yearly" ? "$26.10" : "$29.00"}
              </span>
              <span className="caption-mono text-muted">/ month</span>
            </div>
            <div className="caption-mono" style={{ color: "var(--ink)", fontWeight: 700, marginBottom: "8px" }}>
              {billingCycle === "yearly" ? "132,000 credits/mo ($0.20/1k)" : "120,000 credits/mo ($0.24/1k)"}
            </div>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 20px 0", lineHeight: "18px" }}>
              Take your first workflow from idea to integration. Covers ~9,020 PII redactions or 120,000 decisions.
            </p>

            <div style={{ borderTop: "1px solid var(--track)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>check</span>
                <span>{billingCycle === "yearly" ? "132k credits/mo ($313.20/yr)" : "120k credits included/mo"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>check</span>
                <span>Four requests at a time</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>check</span>
                <span>Overage: $0.30 per 1,000 credits</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>check</span>
                <span>Credits reset monthly</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "24px" }}>
            <a
              href="https://clocked.rezolve.ai/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ width: "100%", padding: "10px", fontSize: "12px", textDecoration: "none", justifyContent: "center" }}
            >
              Select Build Plan ↗
            </a>
          </div>
        </div>

        {/* Tier 3: Production (Highlighted) */}
        <div
          className="card"
          style={{
            padding: "28px 20px",
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
              right: "16px",
              backgroundColor: "var(--accent)",
              color: "#FFFFFF",
              fontSize: "10px",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              padding: "2px 8px",
              borderRadius: "2px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            POPULAR FOR DEPARTMENTS
          </div>

          <div>
            <div className="caption-mono" style={{ color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>
              03 / Production
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "4px" }}>
              <span style={{ fontSize: "32px", fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-inter)" }}>
                {billingCycle === "yearly" ? "$224.10" : "$249.00"}
              </span>
              <span className="caption-mono text-muted">/ month</span>
            </div>
            <div className="caption-mono" style={{ color: "var(--accent)", fontWeight: 700, marginBottom: "8px" }}>
              {billingCycle === "yearly" ? "1,375,000 credits/mo ($0.16/1k)" : "1,250,000 credits/mo ($0.20/1k)"}
            </div>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 20px 0", lineHeight: "18px" }}>
              Put intelligence to work across entire faculties. Covers ~94,000 PII redactions or 1,250,000 decisions.
            </p>

            <div style={{ borderTop: "1px solid var(--track)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>check</span>
                <span>{billingCycle === "yearly" ? "1.375M credits/mo ($2,689.20/yr)" : "1.25M credits included/mo"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>check</span>
                <span>Eight requests at a time</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>check</span>
                <span>Overage: $0.25 per 1,000 credits</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>check</span>
                <span>Flat overage rate, no volume bands</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "24px" }}>
            <a
              href="https://clocked.rezolve.ai/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ width: "100%", padding: "10px", fontSize: "12px", textDecoration: "none", justifyContent: "center" }}
            >
              Select Production Plan ↗
            </a>
          </div>
        </div>

        {/* Tier 4: Scale */}
        <div
          className="card"
          style={{
            padding: "28px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "4px 4px 0 0 var(--ink)",
          }}
        >
          <div>
            <div className="caption-mono text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>
              04 / Scale
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "4px" }}>
              <span style={{ fontSize: "32px", fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-inter)" }}>
                {billingCycle === "yearly" ? "$899.10" : "$999.00"}
              </span>
              <span className="caption-mono text-muted">/ month</span>
            </div>
            <div className="caption-mono" style={{ color: "var(--ink)", fontWeight: 700, marginBottom: "8px" }}>
              {billingCycle === "yearly" ? "7,150,000 credits/mo ($0.13/1k)" : "6,500,000 credits/mo ($0.15/1k)"}
            </div>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 20px 0", lineHeight: "18px" }}>
              More room for campus-wide honor councils and registrar offices. Covers ~489,000 redactions.
            </p>

            <div style={{ borderTop: "1px solid var(--track)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>check</span>
                <span>{billingCycle === "yearly" ? "7.15M credits/mo ($10,789.20/yr)" : "6.5M credits included/mo"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>check</span>
                <span>Sixteen requests at a time</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>check</span>
                <span>Overage: $0.20 per 1,000 credits</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent)" }}>check</span>
                <span>Dedicated Enterprise SLAs</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "24px" }}>
            <a
              href="https://clocked.rezolve.ai/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ width: "100%", padding: "10px", fontSize: "12px", textDecoration: "none", justifyContent: "center" }}
            >
              Select Scale Plan ↗
            </a>
          </div>
        </div>
      </div>

      {/* Interactive Credit Estimator */}
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
            CALCULATOR
          </span>
          <h2 className="card-title" style={{ margin: 0 }}>
            Estimate Your Course Cohort&apos;s Credit Requirements
          </h2>
        </div>
        <p style={{ color: "var(--ink)", lineHeight: 1.6, marginBottom: "24px" }}>
          Reviewing a typical student paper (~1,500 words) against assigned course readings consumes
          approximately <strong>40 to 60 processing credits</strong> (covering automated PII sanitization, citation verification, and syllabus claim grounding).
          Initial document indexing and pairwise comparison are computed locally at <strong>zero incremental cost</strong>.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", marginBottom: "24px" }}>
          <div>
            <label className="label-mono" style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>
              Students in Course Cohort: <span style={{ color: "var(--accent)" }}>{cohortSize}</span>
            </label>
            <input
              type="range"
              min="10"
              max="250"
              step="5"
              value={cohortSize}
              onChange={(e) => setCohortSize(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent)" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--muted)" }}>
              <span>10 students</span>
              <span>250 students</span>
            </div>
          </div>

          <div>
            <label className="label-mono" style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>
              Assigned Essays / Semester: <span style={{ color: "var(--accent)" }}>{papersPerStudent}</span>
            </label>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={papersPerStudent}
              onChange={(e) => setPapersPerStudent(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent)" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--muted)" }}>
              <span>1 paper</span>
              <span>8 papers</span>
            </div>
          </div>

          <div
            style={{
              padding: "16px",
              backgroundColor: "var(--surface-container)",
              border: "1px solid var(--ink)",
              borderRadius: "2px",
            }}
          >
            <div className="caption-mono text-muted" style={{ marginBottom: "4px" }}>ESTIMATED USAGE</div>
            <div style={{ fontSize: "20px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--ink)" }}>
              {totalPapers} Papers · ~{estimatedCredits.toLocaleString()} Credits
            </div>
            <div style={{ fontSize: "12px", color: "var(--accent)", marginTop: "4px", fontWeight: 600 }}>
              {estimatedCredits <= 4000
                ? "✓ Fully covered by Explore (Free Trial)"
                : estimatedCredits <= 120000
                ? "✓ Easily covered by Build ($29/mo)"
                : "✓ Requires Production ($249/mo)"}
            </div>
          </div>
        </div>
      </div>

      {/* Academic Procurement Options */}
      <div className="card" style={{ padding: "32px", marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              background: "var(--ink)",
              color: "var(--paper)",
              padding: "2px 8px",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            PROCUREMENT
          </span>
          <h2 className="card-title" style={{ margin: 0 }}>
            Two Flexible Ways to Deploy Margin Across Your Department
          </h2>
        </div>
        <p style={{ color: "var(--ink)", lineHeight: 1.7, marginBottom: "20px" }}>
          Designed to accommodate both university central IT purchasing and individual faculty expense approvals:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          {/* Option 1 */}
          <div
            style={{
              padding: "20px",
              backgroundColor: "var(--surface)",
              border: "1px solid var(--ink)",
              borderRadius: "2px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--accent)" }}>account_balance</span>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                1. Institutional Account Integration (Direct Connect)
              </h3>
            </div>
            <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: "19px", marginBottom: "12px" }}>
              Connect your institution&apos;s verified AI account directly to Margin with 0% platform surcharge.
            </p>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", lineHeight: "20px", color: "var(--ink)" }}>
              <li><strong>Direct Compliance:</strong> Retain your university&apos;s direct Data Processing Agreements and security attestations.</li>
              <li><strong>Direct Capacity Control:</strong> Manage monthly spending limits and authorized overages directly within your campus dashboard.</li>
              <li><strong>Annual Volume Savings:</strong> Qualify for Clocked&apos;s 10% annual discount and 10% bonus credit pool.</li>
            </ul>
          </div>

          {/* Option 2 */}
          <div
            style={{
              padding: "20px",
              backgroundColor: "var(--surface)",
              border: "1px solid var(--ink)",
              borderRadius: "2px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--accent)" }}>credit_card</span>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                2. All-in-One Semester Packs (Faculty P-Cards &amp; Grants)
              </h3>
            </div>
            <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: "19px", marginBottom: "12px" }}>
              For instructors who need a simple, self-contained solution without managing technical API accounts:
            </p>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", lineHeight: "20px", color: "var(--ink)" }}>
              <li><strong>Turnkey Setup:</strong> Zero API configuration or developer keys required — start reviewing papers immediately.</li>
              <li><strong>Fixed Term Budgeting:</strong> Covers your entire semester cohort (e.g. 250 paper comparisons for $49) with no surprise bills.</li>
              <li><strong>Simplified Invoicing:</strong> Provides standard university expense receipts approved for P-card and grant fund reimbursement.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Credit Mechanics & Billing FAQ */}
      <div style={{ maxWidth: "900px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "20px" }}>
          Billing &amp; Credit Mechanics FAQ
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 8px 0" }}>
              Do unused monthly subscription credits roll over?
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: "20px" }}>
              <strong>No.</strong> Monthly subscription allowances refresh each billing cycle.
              The monthly subscription covers the included usage with no separate seat or platform licensing fees.
            </p>
          </div>
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 8px 0" }}>
              How does overage work if our class submits extra drafts?
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: "20px" }}>
              Overage is off by default until an authorized administrator sets a monthly spending limit.
              Overage is billed at flat rates per 1,000 credits: <strong>$0.30 on Build</strong>, <strong>$0.25 on Production</strong>, and <strong>$0.20 on Scale</strong>.
              There are no surprise step-ups; every extra credit is billed at the same flat rate.
            </p>
          </div>
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 8px 0" }}>
              Is dedicated high-throughput capacity available for university-wide honor courts?
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: "20px" }}>
              Yes. For university-wide rollouts handling thousands of simultaneous submissions during finals week, dedicated GPU capacity starts at <strong>$7,500/month (H200)</strong> or <strong>$10,000/month (B200)</strong> with customized throughput and uptime SLAs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
