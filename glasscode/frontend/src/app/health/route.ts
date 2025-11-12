import { NextResponse } from "next/server";

/**
 * Frontend health endpoint for liveness/readiness checks.
 * It optionally pings the backend `/health` if `NEXT_PUBLIC_API_BASE` is set.
 */
export async function GET() {
  const environment = process.env.NODE_ENV || "development";
  const timestamp = new Date().toISOString();

  let backend = {
    ok: false as boolean,
    status: 0 as number,
    error: "" as string | undefined,
  };

  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  if (apiBase) {
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
  }

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
