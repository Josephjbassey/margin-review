"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    document.title = "Lecturer Sign In · Judge Access · Margin";
  }, []);

  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          name: name || "Course Lecturer",
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
    <div className="container" style={{ maxWidth: "680px", paddingTop: "48px" }}>
      <div style={{ marginBottom: "32px", textAlign: "center" }}>
        <div className="label-mono text-muted" style={{ marginBottom: "8px" }}>
          AUTHENTICATION &amp; FERPA ISOLATION
        </div>
        <h1 className="page-title" style={{ fontSize: "38px" }}>
          Reviewer Access
        </h1>
        <p className="text-muted" style={{ maxWidth: "520px", margin: "0 auto" }}>
          Sign in to create review batches, inspect pairwise conflicts, and record human decisions on student work.
        </p>
      </div>

      {error && (
        <div
          style={{
            background: "#FFF0F0",
            border: "2px solid #D9383A",
            padding: "12px 16px",
            marginBottom: "24px",
            color: "#D9383A",
            fontWeight: 500,
            boxShadow: "3px 3px 0 var(--ink)",
          }}
        >
          {error}
        </div>
      )}

      {/* 1. CLOCKED CHALLENGE JUDGE MODE CARD */}
      <div
        className="card"
        style={{
          border: "2px solid var(--accent)",
          background: "var(--surface)",
          boxShadow: "4px 4px 0 var(--ink)",
          padding: "24px",
          marginBottom: "32px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-12px",
            right: "20px",
            background: "var(--accent)",
            color: "#FFFFFF",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "2px",
            letterSpacing: "0.05em",
          }}
        >
          RECOMMENDED FOR JUDGES
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <div
            style={{
              fontSize: "28px",
              lineHeight: 1,
              padding: "10px",
              background: "var(--wash)",
              border: "2px solid var(--ink)",
              borderRadius: "2px",
            }}
          >
            ⚖️
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "20px", margin: "0 0 6px 0" }}>
              Clocked Challenge Judge Mode
            </h3>
            <p className="text-muted" style={{ fontSize: "14px", margin: "0 0 16px 0", lineHeight: 1.4 }}>
              Zero-friction instant access. Bypasses password creation and email verification so hackathon evaluators can immediately test all 8 Clocked endpoints and review pipeline diagnostics.
            </p>
            <button
              type="button"
              onClick={handleJudgeLogin}
              disabled={judgeLoading}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "12px 20px",
                fontSize: "15px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {judgeLoading ? "Entering Judge Session..." : "Enter as Challenge Judge (1-Click) →"}
            </button>
          </div>
        </div>
      </div>

      {/* 2. COURSE LECTURER AUTH CARD */}
      <div
        className="card"
        style={{
          border: "2px solid var(--ink)",
          background: "var(--surface)",
          boxShadow: "4px 4px 0 var(--ink)",
          padding: "24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "20px", margin: 0 }}>
            {isRegistering ? "Lecturer Registration" : "Lecturer Sign In"}
          </h2>
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent)",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "13px",
              textDecoration: "underline",
            }}
          >
            {isRegistering ? "Already have an account? Sign In" : "Need an account? Register"}
          </button>
        </div>

        <form onSubmit={handleLecturerAuth}>
          {isRegistering && (
            <div style={{ marginBottom: "16px" }}>
              <label className="label-mono" style={{ display: "block", marginBottom: "6px" }}>
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Eleanor Vance"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "2px solid var(--ink)",
                  borderRadius: "2px",
                  fontFamily: "var(--font-inter)",
                  fontSize: "15px",
                  background: "#FFFFFF",
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label className="label-mono" style={{ display: "block", marginBottom: "6px" }}>
              Academic Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="lecturer@university.edu"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "2px solid var(--ink)",
                borderRadius: "2px",
                fontFamily: "var(--font-inter)",
                fontSize: "15px",
                background: "#FFFFFF",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label className="label-mono" style={{ display: "block", marginBottom: "6px" }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "2px solid var(--ink)",
                borderRadius: "2px",
                fontFamily: "var(--font-inter)",
                fontSize: "15px",
                background: "#FFFFFF",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-outline"
            style={{ width: "100%", padding: "12px 20px", fontSize: "15px" }}
          >
            {loading
              ? "Authenticating..."
              : isRegistering
              ? "Create Lecturer Account"
              : "Sign In as Lecturer"}
          </button>
        </form>
      </div>

      <div style={{ marginTop: "24px", textAlign: "center" }}>
        <Link href="/" className="label-mono text-muted" style={{ textDecoration: "none" }}>
          ← Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
