import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { auth } from "../lib/auth";
import { POST as judgeLoginHandler } from "../app/api/auth/judge-login/route";

describe("auth.ts - Better Auth & Judge Mode", () => {
  it("initializes Better Auth with email/password and custom role support", () => {
    assert.ok(auth);
    assert.strictEqual(typeof auth.handler, "function");
    assert.strictEqual(typeof auth.api.signInEmail, "function");
    assert.strictEqual(typeof auth.api.signUpEmail, "function");
  });

  it("registers and signs in a lecturer via Better Auth API", async () => {
    const testEmail = `lecturer-${Date.now()}@university.edu`;
    const testPassword = "Lecturer-Secure-Password-2026!";

    // 1. Sign up
    const signUpRes = await auth.api.signUpEmail({
      body: {
        name: "Dr. Eleanor Vance",
        email: testEmail,
        password: testPassword,
      },
    });

    assert.ok(signUpRes);
    assert.ok(signUpRes.token);
    assert.strictEqual(signUpRes.user.email, testEmail);
    assert.strictEqual(signUpRes.user.name, "Dr. Eleanor Vance");

    // 2. Sign in as response to verify session cookie
    const signInRes = await auth.api.signInEmail({
      body: {
        email: testEmail,
        password: testPassword,
      },
      asResponse: true,
    });

    assert.strictEqual(signInRes.status, 200);
    const cookie = signInRes.headers.get("set-cookie");
    assert.ok(cookie);
    assert.ok(cookie.includes("better-auth.session_token"));
  });

  it("Judge Mode 1-click endpoint provisions and returns authenticated session", async () => {
    const response = await judgeLoginHandler();
    assert.strictEqual(response.status, 200);

    const body = await response.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.user.email, "judge@margin.edu");
    assert.strictEqual(body.user.role, "judge");

    const cookie = response.headers.get("set-cookie");
    assert.ok(cookie);
    assert.ok(cookie.includes("better-auth.session_token"));
  });
});
