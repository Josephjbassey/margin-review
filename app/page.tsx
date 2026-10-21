import Link from "next/link";

export default function BatchesPage() {
  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <h1 className="page-title">Batches</h1>
          <p className="text-muted" style={{ margin: 0, fontSize: 16 }}>
            Review queues, pairwise text alignment runs, and grounded originality claims.
          </p>
        </div>
        <Link href="/new" className="btn btn-primary">
          <span>+ New batch</span>
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 36 }}>
        <div className="card">
          <div className="caption-mono text-muted">QUEUE VOLUME</div>
          <div style={{ fontSize: 36, fontWeight: 700, margin: "8px 0" }}>0</div>
          <div className="label-mono text-muted">Total submissions ingested</div>
        </div>
        <div className="card">
          <div className="caption-mono text-muted">EVIDENTIARY CLAIMS</div>
          <div style={{ fontSize: 36, fontWeight: 700, margin: "8px 0" }}>0</div>
          <div className="label-mono text-muted">Pending lecturer evaluation</div>
        </div>
        <div className="card">
          <div className="caption-mono text-muted">DECISION VELOCITY</div>
          <div style={{ fontSize: 36, fontWeight: 700, margin: "8px 0" }}>0%</div>
          <div className="label-mono text-muted">Reviewed findings</div>
        </div>
      </div>

      <div className="card" style={{ padding: 32, textAlign: "center" }}>
        <p className="text-muted" style={{ margin: "0 0 16px 0" }}>
          No review batches yet. Create a batch to analyze student submissions against a course reading pack.
        </p>
        <Link href="/new" className="btn btn-primary">
          Start new batch
        </Link>
      </div>
    </div>
  );
}
