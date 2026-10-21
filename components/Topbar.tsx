import Link from "next/link";

interface TopbarProps {
  active?: "batches" | "reading" | "decisions";
}

export function Topbar({ active = "batches" }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-content">
        <Link href="/" className="topbar-brand">
          <span>MARGIN</span>
          <span className="brand-badge">ACAD-REV</span>
        </Link>

        <nav className="topbar-nav">
          <Link
            href="/"
            className={`topbar-link ${active === "batches" ? "active" : ""}`}
          >
            Batches
          </Link>
          <Link
            href="/new"
            className={`topbar-link ${active === "reading" ? "active" : ""}`}
          >
            New Batch
          </Link>
        </nav>

        <div className="topbar-right">
          <div className="badge-lecturer">Lecturer</div>
        </div>
      </div>
    </header>
  );
}
