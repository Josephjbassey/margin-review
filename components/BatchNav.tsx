"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BatchNavProps {
  batchId: string;
  batchName: string;
  maskedCount?: number;
  totalSubmissions?: number;
}

export function BatchNav({
  batchId,
  batchName,
  maskedCount = 0,
  totalSubmissions = 0,
}: BatchNavProps) {
  const pathname = usePathname();

  const isOverlap = pathname.includes("/overlap");
  const isClaims = pathname.includes("/claims");
  const isDecisions = pathname.includes("/decisions");

  return (
    <div
      style={{
        borderBottom: "1px solid var(--ink)",
        backgroundColor: "var(--paper)",
        padding: "16px 0 0 0",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Link
              href="/"
              className="caption-mono text-muted"
              style={{ textDecoration: "none" }}
            >
              ← All Batches
            </Link>
            <span className="caption-mono text-muted">/</span>
            <span className="caption-mono tag tag-draft" style={{ padding: "2px 6px" }}>
              ID: {batchId}
            </span>
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
              letterSpacing: "-0.015em",
            }}
          >
            {batchName}
          </h1>
          <div
            className="caption-mono text-muted"
            style={{ marginTop: 4, display: "flex", gap: 12 }}
          >
            <span>{totalSubmissions} submissions</span>
            <span>·</span>
            <span>{maskedCount} identifiers masked (FERPA isolation)</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a
            href={`/api/batches/${batchId}/export`}
            download
            className="btn btn-secondary btn-sm"
            title="Download review markdown audit"
          >
            ↓ Export Markdown
          </a>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: "16px auto 0 auto",
          padding: "0 40px",
          display: "flex",
          gap: 32,
        }}
      >
        <Link
          href={`/batches/${batchId}/overlap`}
          className={`topbar-link ${isOverlap ? "active" : ""}`}
          style={{ height: 42, paddingBottom: 8 }}
        >
          Overlap Review
        </Link>
        <Link
          href={`/batches/${batchId}/claims`}
          className={`topbar-link ${isClaims ? "active" : ""}`}
          style={{ height: 42, paddingBottom: 8 }}
        >
          Claims Check
        </Link>
        <Link
          href={`/batches/${batchId}/decisions`}
          className={`topbar-link ${isDecisions ? "active" : ""}`}
          style={{ height: 42, paddingBottom: 8 }}
        >
          Decisions Summary
        </Link>
      </div>
    </div>
  );
}
