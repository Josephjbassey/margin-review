"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface TopbarProps {
  active?: "batches" | "reading" | "decisions";
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

        <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {!isPending && session?.user ? (
            <>
              {isJudge ? (
                <div
                  style={{
                    background: "var(--accent)",
                    color: "#FFFFFF",
                    padding: "4px 8px",
                    borderRadius: "2px",
                    fontSize: "11px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.04em",
                    border: "1px solid var(--ink)",
                  }}
                >
                  ⚖️ Judge Mode
                </div>
              ) : (
                <div className="badge-lecturer">
                  {session.user.name ? session.user.name.split(" ")[0] : "Lecturer"}
                </div>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                title="Sign out of review session"
                style={{
                  background: "transparent",
                  border: "1px solid var(--ink)",
                  color: "var(--ink)",
                  padding: "3px 8px",
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
              className="btn btn-outline"
              style={{
                padding: "4px 12px",
                fontSize: "12px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Judge Access / Sign In
            </Link>
          ) : (
            <div className="badge-lecturer">...</div>
          )}
        </div>
      </div>
    </header>
  );
}
