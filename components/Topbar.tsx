"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface TopbarProps {
  active?: "batches" | "reading" | "decisions" | "privacy" | "pricing";
}

export function Topbar({ active }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const [judgeLoading, setJudgeLoading] = useState(false);

  // Editable institution affiliation state
  const [institution, setInstitution] = useState<string>("");
  const [isEditingInst, setIsEditingInst] = useState<boolean>(false);
  const [tempInst, setTempInst] = useState<string>("");

  const user = session?.user as
    | { role?: string; email?: string; name?: string }
    | undefined;

  const isJudge =
    user?.role === "judge" ||
    user?.email === "judge@margin.edu";

  // Initialize institution from localStorage, user email, or default role
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("margin_institution");
      if (stored) {
        setInstitution(stored);
        return;
      }
    }

    if (isJudge) {
      setInstitution("Honor Review Council");
    } else if (user?.email) {
      // Derive a polite academic affiliation default if possible
      const parts = user.email.split("@");
      if (parts[1]?.includes("ox.ac.uk")) {
        setInstitution("Oxford University");
      } else if (parts[1]?.includes(".edu")) {
        setInstitution("Collegiate Faculty");
      } else {
        setInstitution(user.email);
      }
    } else {
      setInstitution("Faculty Reviewer");
    }
  }, [isJudge, user?.email]);

  function handleSaveInstitution() {
    const trimmed = tempInst.trim() || user?.email || "Faculty Reviewer";
    setInstitution(trimmed);
    if (typeof window !== "undefined") {
      localStorage.setItem("margin_institution", trimmed);
    }
    setIsEditingInst(false);
  }

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleQuickJudgeLogin() {
    setJudgeLoading(true);
    try {
      const res = await fetch("/api/auth/judge-login", { method: "POST" });
      if (res.ok) {
        router.push("/");
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setJudgeLoading(false);
    }
  }

  // Determine active route automatically if not explicitly provided
  const isBatchesActive =
    active === "batches" ||
    (!active && (pathname === "/" || pathname.startsWith("/batches")));
  const isNewActive =
    active === "reading" ||
    (!active && pathname.startsWith("/new"));
  const isPrivacyActive =
    active === "privacy" ||
    (!active && pathname.startsWith("/privacy"));
  const isPricingActive =
    active === "pricing" ||
    (!active && pathname.startsWith("/pricing"));

  return (
    <header className="topbar">
      <div className="topbar-content">
        <Link href="/" className="topbar-brand">
          <span>MARGIN</span>
          <span className="brand-badge">FACULTY</span>
        </Link>

        <nav className="topbar-nav">
          {!isPending && session?.user ? (
            <>
              <Link
                href="/"
                className={`topbar-link ${isBatchesActive ? "active" : ""}`}
              >
                Batches
              </Link>
              <Link
                href="/new"
                className={`topbar-link ${isNewActive ? "active" : ""}`}
              >
                New Batch
              </Link>
              <Link
                href="/pricing"
                className={`topbar-link ${isPricingActive ? "active" : ""}`}
              >
                Pricing &amp; Credits
              </Link>
              <Link
                href="/privacy"
                className={`topbar-link ${isPrivacyActive ? "active" : ""}`}
              >
                FERPA &amp; Security
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/"
                className={`topbar-link ${pathname === "/" ? "active" : ""}`}
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
                href="/pricing"
                className={`topbar-link ${isPricingActive ? "active" : ""}`}
              >
                Pricing (Soon)
              </Link>
              <Link
                href="/privacy"
                className={`topbar-link ${isPrivacyActive ? "active" : ""}`}
              >
                FERPA &amp; Security
              </Link>
            </>
          )}
        </nav>

        <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {!isPending && session?.user ? (
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  gap: "2px",
                }}
                className="hidden sm:flex"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      lineHeight: "14px",
                      padding: "1px 6px",
                      border: "1px solid var(--ink)",
                      borderRadius: "2px",
                      textTransform: "uppercase",
                      color: "var(--ink)",
                      background: isJudge ? "var(--wash)" : "var(--surface)",
                      fontWeight: 700,
                    }}
                  >
                    {isJudge ? "Judge" : "Lecturer"}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--ink)",
                      maxWidth: "160px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={user?.name || user?.email || "Faculty Reviewer"}
                  >
                    {user?.name || (isJudge ? "Adjudication Judge" : (user?.email?.split("@")[0] || "Faculty Reviewer"))}
                  </span>
                </div>

                {/* Editable Institution / Affiliation / Email */}
                {isEditingInst ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveInstitution();
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "4px", margin: 0 }}
                  >
                    <input
                      type="text"
                      value={tempInst}
                      onChange={(e) => setTempInst(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setIsEditingInst(false);
                      }}
                      onBlur={handleSaveInstitution}
                      placeholder="e.g. Oxford, Stanford, or email"
                      autoFocus
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        padding: "1px 6px",
                        border: "1px solid var(--accent)",
                        borderRadius: "2px",
                        background: "var(--surface)",
                        color: "var(--ink)",
                        outline: "none",
                        width: "150px",
                      }}
                    />
                    <button
                      type="submit"
                      title="Save affiliation"
                      style={{
                        background: "var(--accent)",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "2px",
                        padding: "2px 6px",
                        fontSize: "10px",
                        cursor: "pointer",
                        fontFamily: "var(--font-mono)",
                        lineHeight: 1,
                      }}
                    >
                      ✓
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setTempInst(institution);
                      setIsEditingInst(true);
                    }}
                    title="Click to change your institution, department, or email"
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      margin: 0,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      color: "var(--muted)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      maxWidth: "180px",
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "160px",
                      }}
                    >
                      {institution || user?.email || "Faculty Reviewer"}
                    </span>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "12px", opacity: 0.65 }}
                    >
                      edit
                    </span>
                  </button>
                )}
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
                title={user?.name || user?.email || "Lecturer"}
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={handleQuickJudgeLogin}
                disabled={judgeLoading}
                className="btn btn-secondary btn-sm"
                style={{
                  padding: "4px 10px",
                  fontSize: "11px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                title="1-Click Evaluation Access for Hackathon Judges"
              >
                <span>⚖️</span>
                <span>{judgeLoading ? "Authorizing..." : "Judge Access"}</span>
              </button>
              <Link
                href="/login"
                className="btn btn-primary btn-sm"
                style={{
                  textDecoration: "none",
                  padding: "4px 12px",
                  fontSize: "12px",
                }}
              >
                Sign In
              </Link>
            </div>
          ) : (
            <div className="badge-lecturer">...</div>
          )}
        </div>
      </div>
    </header>
  );
}
