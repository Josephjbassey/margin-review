import Link from "next/link";

export default function NotFound() {
  return (
    <div className="content-container" style={{ paddingTop: "80px", paddingBottom: "100px" }}>
      <div
        className="card"
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          padding: "40px",
          textAlign: "center",
          background: "var(--surface)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <span
            className="tag tag-conflict"
            style={{
              padding: "4px 12px",
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
            }}
          >
            HTTP 404 · RECORD_NOT_FOUND
          </span>
        </div>

        <h1 className="page-title" style={{ fontSize: "38px", marginBottom: "16px" }}>
          Manuscript Not Found
        </h1>

        <p
          style={{
            color: "var(--muted)",
            fontSize: "16px",
            lineHeight: 1.6,
            marginBottom: "32px",
          }}
        >
          The requested forensic batch, citation offset, or submission record does not exist
          in the local review index. It may have been purged or relocated.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" className="btn btn-primary" style={{ textDecoration: "none" }}>
            Return to Batches
          </Link>
          <Link href="/new" className="btn btn-secondary" style={{ textDecoration: "none" }}>
            Start New Batch
          </Link>
        </div>

        <div
          style={{
            marginTop: "32px",
            paddingTop: "24px",
            borderTop: "1px dashed var(--track)",
            fontSize: "13px",
            color: "var(--muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          Margin · Academic Integrity Forensic Review System
        </div>

      </div>
    </div>
  );
}
