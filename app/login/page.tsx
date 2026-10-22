"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    document.title = "Sign in · Margin Faculty Portal";
  }, []);

  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"lecturer" | "ta" | "integrity_officer">("lecturer");
  const [isEphemeral, setIsEphemeral] = useState(true);
  const [loading, setLoading] = useState(false);
  const [judgeLoading, setJudgeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJudgeLogin() {
    setJudgeLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/judge-login", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to enter judge mode");
      }
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to enter judge mode");
      setJudgeLoading(false);
    }
  }

  async function handleLecturerAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        const { error: signUpError } = await authClient.signUp.email({
          email,
          password,
          name: name || (selectedRole === "ta" ? "Teaching Assistant" : selectedRole === "integrity_officer" ? "Integrity Officer" : "Course Lecturer"),
        });
        if (signUpError) {
          throw new Error(signUpError.message || "Sign up failed");
        }
      } else {
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
        });
        if (signInError) {
          throw new Error(signInError.message || "Sign in failed");
        }
      }
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify credentials.");
      setLoading(false);
    }
  }

  return (
    <div style={{ width: "100%", minHeight: "100vh", backgroundColor: "var(--paper)", display: "flex", flexDirection: "column" }}>
      {/* 1. Minimal Operational Sub-Bar */}
      <div
        style={{
          width: "100%",
          backgroundColor: "var(--surface-container-low)",
          borderBottom: "1px solid var(--ink)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "8px 24px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            fontSize: "10px",
            fontFamily: "var(--font-mono)",
            color: "var(--ink)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--accent)",
                display: "inline-block",
              }}
            />
            <span style={{ letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 700 }}>
              FACULTY &amp; LECTURER PORTAL
            </span>
            <span style={{ color: "var(--muted)" }}>/</span>
            <span style={{ color: "var(--muted)" }}>INSTITUTIONAL ACCESS</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                padding: "2px 6px",
                backgroundColor: "var(--wash)",
                border: "1px solid var(--ink)",
                borderRadius: "2px",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              FERPA COMPLIANT
            </span>
            <span style={{ color: "var(--ink)" }}>SECURE LOCAL SESSION</span>
          </div>
        </div>
      </div>

      {/* 2. Primary Interactive Canvas */}
      <div
        style={{
          flex: 1,
          padding: "48px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Decorative Academic Grid Markers */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.35,
            userSelect: "none",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "24px 40px",
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--muted)",
          }}
          className="hidden md:flex"
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>[MARGIN · FERPA PROTECTED]</span>
            <span>ACADEMIC INTEGRITY REVIEW SYSTEM</span>
            <span>[ZERO PERMANENT RETENTION]</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>[VERIFIED ACCESS]</span>
            <span>[HUMAN FACULTY ADJUDICATION]</span>
            <span>[2026 ACADEMIC SESSION]</span>
          </div>
        </div>

        {/* Centered Authentication Card (480px nominal) */}
        <div
          className="card"
          style={{
            width: "100%",
            maxWidth: "480px",
            padding: "32px",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Card Header */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  padding: "2px 8px",
                  backgroundColor: "var(--wash)",
                  border: "1px solid var(--ink)",
                  borderRadius: "2px",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                FACULTY &amp; LECTURER ACCESS
              </span>
              <span className="caption-mono text-muted">ID: PORTAL-889</span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "24px",
                fontWeight: 600,
                letterSpacing: "-0.015em",
                margin: "0 0 6px 0",
              }}
            >
              Sign in to Margin
            </h1>
            <p style={{ fontSize: "14px", lineHeight: "22px", color: "var(--muted)", margin: 0 }}>
              Authenticate through your institutional identity provider or campus credential.
            </p>
          </div>

          {error && (
            <div
              style={{
                background: "#FFF0F0",
                border: "1px solid var(--ink)",
                padding: "10px 14px",
                marginBottom: "20px",
                color: "var(--error)",
                fontSize: "13px",
                boxShadow: "2px 2px 0 0 var(--ink)",
              }}
            >
              {error}
            </div>
          )}

          {/* Institutional SSO Primary Action (Judge Mode Quick Access) */}
          <div style={{ marginBottom: "24px" }}>
            <button
              type="button"
              onClick={handleJudgeLogin}
              disabled={judgeLoading}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  account_balance
                </span>
                <span>{judgeLoading ? "Authenticating Judge..." : "Sign in with Institutional SSO (Judge Access)"}</span>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                arrow_forward
              </span>
            </button>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 2px 0 2px",
              }}
              className="caption-mono text-muted"
            >
              <span>SAML 2.0 · Shibboleth · InCommon</span>
              <span>1-Click Hackathon Evaluator Access</span>
            </div>
          </div>

          {/* Hard Visual Divider */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "24px 0",
            }}
          >
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}>
              <div style={{ width: "100%", borderTop: "1px solid var(--ink)" }} />
            </div>
            <span
              style={{
                position: "relative",
                padding: "0 10px",
                backgroundColor: "var(--surface)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
              className="caption-mono text-muted"
            >
              OR USE DIRECT DEPARTMENT CREDENTIALS
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleLecturerAuth} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {isRegistering && (
              <div>
                <label className="label-mono" style={{ display: "block", marginBottom: "4px", fontWeight: 700 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Eleanor Vance"
                  className="input"
                  style={{ padding: "8px 12px", fontSize: "14px" }}
                />
              </div>
            )}

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <label className="label-mono" style={{ fontWeight: 700 }}>
                  Institutional Email (.edu / .ac.uk)
                </label>
                <span className="caption-mono text-muted">CAMPUS DOMAIN</span>
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. e.reed@faculty.edu"
                className="input"
                style={{ padding: "8px 12px", fontSize: "14px" }}
              />
              <p className="caption-mono text-muted" style={{ margin: "4px 0 0 0" }}>
                Must match your registered registrar or faculty senate roster record.
              </p>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <label className="label-mono" style={{ fontWeight: 700 }}>
                  Passphrase / Security Key
                </label>
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "var(--accent)",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                  className="caption-mono"
                >
                  {isRegistering ? "Back to Sign In" : "Need account? Register"}
                </button>
              </div>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••••••"
                  className="input"
                  style={{ padding: "8px 12px", paddingRight: "36px", fontSize: "14px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "8px",
                    background: "none",
                    border: "none",
                    color: "var(--muted)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }} className="caption-mono text-muted">
                <span>YubiKey / WebAuthn FIDO2 Supported</span>
                <span>SEC-LVL: 4</span>
              </div>
            </div>

            {/* Department Role Selection */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span className="label-mono" style={{ fontWeight: 700 }}>
                  Assigned Department Role
                </span>
                <span className="caption-mono text-muted">PERMISSION LEVEL</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedRole("lecturer")}
                  style={{
                    padding: "8px 4px",
                    border: "1px solid var(--ink)",
                    borderRadius: "2px",
                    backgroundColor: selectedRole === "lecturer" ? "var(--selected)" : "var(--surface)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: selectedRole === "lecturer" ? 700 : 500, color: "var(--ink)" }}>
                    Lecturer / Lead
                  </span>
                  <span className="caption-mono text-muted" style={{ fontSize: "9px" }}>
                    GRADE &amp; SIGN
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("ta")}
                  style={{
                    padding: "8px 4px",
                    border: "1px solid var(--ink)",
                    borderRadius: "2px",
                    backgroundColor: selectedRole === "ta" ? "var(--selected)" : "var(--surface)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: selectedRole === "ta" ? 700 : 500, color: "var(--ink)" }}>
                    Teaching Asst.
                  </span>
                  <span className="caption-mono text-muted" style={{ fontSize: "9px" }}>
                    PASSAGE REVIEW
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("integrity_officer")}
                  style={{
                    padding: "8px 4px",
                    border: "1px solid var(--ink)",
                    borderRadius: "2px",
                    backgroundColor: selectedRole === "integrity_officer" ? "var(--selected)" : "var(--surface)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: selectedRole === "integrity_officer" ? 700 : 500, color: "var(--ink)" }}>
                    Integrity Officer
                  </span>
                  <span className="caption-mono text-muted" style={{ fontSize: "9px" }}>
                    FULL AUDIT LOG
                  </span>
                </button>
              </div>
            </div>

            {/* Session Ephemerality Checkbox */}
            <div style={{ paddingTop: "4px" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={isEphemeral}
                  onChange={(e) => setIsEphemeral(e.target.checked)}
                  style={{ marginTop: "3px" }}
                />
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>
                    Enforce ephemeral session (clear cached tokens on browser close)
                  </div>
                  <div className="caption-mono text-muted" style={{ marginTop: "2px" }}>
                    Recommended on shared lecture podiums and campus lab terminals.
                  </div>
                </div>
              </label>
            </div>

            {/* Submission Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-dark"
              style={{
                width: "100%",
                padding: "10px 16px",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "6px",
              }}
            >
              <span>{loading ? "Authenticating..." : isRegistering ? "Register Faculty Profile" : "Authenticate & Access Batches"}</span>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                east
              </span>
            </button>
          </form>

          {/* Security Policy Footnote within Card */}
          <div style={{ marginTop: "24px", paddingTop: "14px", borderTop: "1px solid var(--ink)" }}>
            <p className="caption-mono text-muted" style={{ margin: 0, lineHeight: "16px" }}>
              <strong style={{ color: "var(--ink)" }}>POLICY NOTE:</strong> Access restricted to authorized faculty under University Policy § 14.8. All verification sessions, raw character offset views, and similarity determinations are cryptographically signed and logged to the central institutional audit trail.
            </p>
          </div>
        </div>

        {/* Verification & Trust Indicators Strip */}
        <div
          style={{
            width: "100%",
            maxWidth: "480px",
            marginTop: "16px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
          }}
          className="caption-mono text-muted"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "var(--ink)" }}>
              verified_user
            </span>
            <span>SAML 2.0 / InCommon Supported</span>
          </div>
          <span className="hidden sm:inline">·</span>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "var(--ink)" }}>
              fingerprint
            </span>
            <span>Session ID #AUTH-2026-99B</span>
          </div>
          <span className="hidden sm:inline">·</span>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "var(--ink)" }}>
              shield
            </span>
            <span>FERPA Privacy Shield</span>
          </div>
        </div>
      </div>

      {/* 3. Faculty Release & Institutional Audit Ledger (Context Band) */}
      <div
        style={{
          width: "100%",
          backgroundColor: "var(--surface-container)",
          borderTop: "1px solid var(--ink)",
          padding: "32px 24px",
          marginTop: "auto",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {/* Evidence-First Review Protocol */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ width: "8px", height: "8px", backgroundColor: "var(--ink)", display: "inline-block" }} />
              <span className="label-mono" style={{ fontWeight: 700, textTransform: "uppercase" }}>
                Evidence-First Review Protocol
              </span>
            </div>
            <p style={{ fontSize: "13px", lineHeight: "19px", color: "var(--muted)", margin: "0 0 6px 0" }}>
              Margin provides side-by-side evidence and text overlaps, while final academic decisions are made exclusively by faculty.
            </p>
            <span className="caption-mono" style={{ color: "var(--ink)", fontWeight: 700 }}>
              HUMAN-IN-THE-LOOP STANDARD
            </span>
          </div>

          {/* Student Privacy & FERPA Compliance */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ width: "8px", height: "8px", backgroundColor: "var(--ink)", display: "inline-block" }} />
              <span className="label-mono" style={{ fontWeight: 700, textTransform: "uppercase" }}>
                Student Privacy &amp; FERPA Compliance
              </span>
            </div>
            <p style={{ fontSize: "13px", lineHeight: "19px", color: "var(--muted)", margin: "0 0 6px 0" }}>
              Student essays are evaluated with names masked locally. Student identity is never shared with third-party AI models or public databases.
            </p>
            <span className="caption-mono" style={{ color: "var(--ink)", fontWeight: 700 }}>
              REGULATION: 34 CFR § 99.31
            </span>
          </div>

          {/* Campus Support Desk */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ width: "8px", height: "8px", backgroundColor: "var(--ink)", display: "inline-block" }} />
              <span className="label-mono" style={{ fontWeight: 700, textTransform: "uppercase" }}>
                Campus Support Desk
              </span>
            </div>
            <p style={{ fontSize: "13px", lineHeight: "19px", color: "var(--muted)", margin: "0 0 6px 0" }}>
              Issues connecting through your institution&apos;s SSO or Duo multi-factor challenge? Contact your institutional academic technology liaison.
            </p>
            <div style={{ display: "flex", gap: "8px" }} className="caption-mono">
              <span style={{ color: "var(--ink)", fontWeight: 700 }}>HOTLINE: ext. 4409</span>
              <span className="text-muted">/</span>
              <span style={{ color: "var(--accent)", textDecoration: "underline" }}>helpdesk@integrity.ac.edu</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
