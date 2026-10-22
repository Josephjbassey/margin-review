"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface TopbarProps {
  active?: "batches" | "reading" | "decisions" | "privacy";
}

export function Topbar({ active = "batches" }: TopbarProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  const user = session?.user as
    | { role?: string; email?: string; name?: string }
    | undefined;

  const isJudge =
    user?.role === "judge" ||
    user?.email === "judge@margin.edu";

  return (
    <header className="topbar">
      <div className="topbar-content">
        <Link href="/" className="topbar-brand">
          <span>MARGIN</span>
          <span className="brand-badge">ACAD-REV</span>
        </Link>

        <nav className="topbar-nav">
          {!isPending && session?.user ? (
            <>
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
              <Link
                href="/privacy"
                className={`topbar-link ${active === "privacy" ? "active" : ""}`}
              >
                FERPA Policy
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/"
                className={`topbar-link ${active === "batches" ? "active" : ""}`}
              >
                Overview
              </Link>
              <Link
                href="/#architecture"
                className="topbar-link"
              >
                How It Works
              </Link>
              <Link
                href="/#specs"
                className="topbar-link"
              >
                Comparison
              </Link>
              <Link
                href="/#pricing"
                className="topbar-link"
              >
                Pricing (Soon)
              </Link>
              <Link
                href="/privacy"
                className={`topbar-link ${active === "privacy" ? "active" : ""}`}
              >
                FERPA Policy
              </Link>
            </>
          )}
        </nav>

        <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {!isPending && session?.user ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }} className="hidden sm:flex">
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    lineHeight: "16px",
                    padding: "2px 8px",
                    border: "1px solid var(--ink)",
                    borderRadius: "2px",
                    textTransform: "uppercase",
                    color: "var(--ink)",
                    background: isJudge ? "var(--wash)" : "transparent",
                    fontWeight: 700,
                  }}
                >
                  {isJudge ? "Judge" : "Lecturer"}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--muted)",
                    padding: "0 4px",
                  }}
                >
                  Faculty Reviewer
                </span>
              </div>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  flexShrink: 0,
                }}
                title={session.user.name || "Lecturer"}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  person
                </span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                title="Sign out of review session"
                style={{
                  background: "transparent",
                  border: "1px solid var(--ink)",
                  color: "var(--ink)",
                  padding: "4px 8px",
                  fontSize: "11px",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  borderRadius: "2px",
                }}
              >
                Sign Out
              </button>
            </>
          ) : !isPending ? (
            <Link
              href="/login"
              className="btn btn-primary btn-sm"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>⚖️</span>
              <span>Judge Access / Sign In</span>
            </Link>
          ) : (
            <div className="badge-lecturer">...</div>
          )}
        </div>
      </div>
    </header>
  );
}
