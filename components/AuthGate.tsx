"use client";

import { useState } from "react";
import Link from "next/link";

export function AuthGate({
  title = "Reviewer Authentication Required",
  subtitle = "Student manuscripts and pairwise forensic alignments are protected under FERPA data isolation guidelines. Please sign in as a verified lecturer or activate Judge Mode to proceed.",
}: {
  title?: string;
  subtitle?: string;
}) {
  const [judgeLoading, setJudgeLoading] = useState(false);

  const handleJudgeLogin = async () => {
    setJudgeLoading(true);
    try {
      const res = await fetch("/api/auth/judge-login", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setJudgeLoading(false);
    }
  };

  return (
    <div className="content-container" style={{ paddingTop: "80px", paddingBottom: "120px" }}>
      <div
        className="card"
        style={{
          maxWidth: "580px",
          margin: "0 auto",
          padding: "36px",
          textAlign: "center",
          background: "var(--surface)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <span className="tag tag-in-review" style={{ fontWeight: 700 }}>
            FERPA ACCESS CONTROL
          </span>
        </div>

        <h2 className="section-title" style={{ fontSize: "28px", marginBottom: "12px" }}>
          {title}
        </h2>

        <p style={{ color: "var(--muted)", fontSize: "15px", lineHeight: 1.6, marginBottom: "28px" }}>
          {subtitle}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "340px", margin: "0 auto" }}>
          <button
            type="button"
            onClick={handleJudgeLogin}
            disabled={judgeLoading}
            className="btn btn-primary"
            style={{
              padding: "12px",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <span>⚖️</span>
            {judgeLoading ? "Authorizing..." : "1-Click Judge Mode Access"}
          </button>

          <Link
            href="/login"
            className="btn btn-secondary"
            style={{
              textDecoration: "none",
              padding: "12px",
              fontSize: "14px",
            }}
          >
            Lecturer Sign In / Register →
          </Link>

          <Link
            href="/"
            style={{
              color: "var(--muted)",
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              marginTop: "8px",
            }}
          >
            ← Return to Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
