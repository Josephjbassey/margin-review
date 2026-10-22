import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST() {
  try {
    const credentials = {
      email: "judge@margin.edu",
      password: "Judge-Clocked-2026-Review!",
    };

    let authResponse = await auth.api.signInEmail({
      body: credentials,
      asResponse: true,
    });

    if (authResponse.status !== 200) {
      await auth.api.signUpEmail({
        body: {
          name: "Clocked Challenge Evaluator",
          role: "judge",
          ...credentials,
        },
      });

      authResponse = await auth.api.signInEmail({
        body: credentials,
        asResponse: true,
      });
    }

    const responseHeaders = new Headers();
    const setCookie = authResponse.headers.get("set-cookie");
    if (setCookie) {
      responseHeaders.set("set-cookie", setCookie);
    }
    responseHeaders.set("content-type", "application/json");

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          name: "Clocked Challenge Evaluator",
          email: "judge@margin.edu",
          role: "judge",
        },
      }),
      {
        status: 200,
        headers: responseHeaders,
      }
    );
  } catch (error: any) {
    console.error("Judge login failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to enter judge mode" },
      { status: 500 }
    );
  }
}
