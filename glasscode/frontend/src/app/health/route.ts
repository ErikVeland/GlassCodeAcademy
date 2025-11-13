import { NextResponse } from "next/server";
import { getApiBaseStrict } from "@/lib/urlUtils";

/**
 * Frontend health endpoint for liveness/readiness checks.
 * It optionally pings the backend `/health` if `NEXT_PUBLIC_API_BASE` is set.
 */
export async function GET() {
  const apiBase = (() => {
    try {
      return getApiBaseStrict().replace(/\/+$/, "");
    } catch {
      // Prefer local Fastify API during migration
      return "http://127.0.0.1:8081";
    }
  })();

  let backend: { ok: boolean; status: number; error?: string } = {
    ok: false,
    status: 0,
    error: undefined,
  };

  try {
    // If apiBase ends with /api, strip it for the backend origin, then hit /health
    const backendHealthUrl = apiBase.replace(/\/api$/, "") + "/health";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(backendHealthUrl, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    backend = {
      ok: res.ok,
      status: res.status,
      error: res.ok ? undefined : `Backend health responded ${res.status}`,
    };
  } catch (err) {
    backend = {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }

  const timestamp = new Date().toISOString();
  const environment = process.env.NODE_ENV || "development";

  return NextResponse.json({
    success: true,
    data: {
      message: "Frontend server is running",
      timestamp,
      environment,
      backend,
    },
  });
}
