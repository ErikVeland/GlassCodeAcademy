import { NextRequest, NextResponse } from "next/server";
import { getApiBaseStrict } from "@/lib/urlUtils";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = url.search || "";
    const apiBase = (() => {
      try {
        return getApiBaseStrict();
      } catch {
        return "http://127.0.0.1:8080";
      }
    })();
    const backendUrl = `${apiBase}/api/courses${query}`;
    const res = await fetch(backendUrl, {
      cache: "no-store",
      headers: { Authorization: req.headers.get("authorization") || "" },
    });
    const text = await res.text();
    let body = text;
    try {
      const parsed = JSON.parse(text);
      body = JSON.stringify(
        Array.isArray(parsed) ? parsed : (parsed?.data ?? parsed),
      );
    } catch {}
    return new NextResponse(body, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Proxy GET /api/courses failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses from backend" },
      { status: 502 },
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
