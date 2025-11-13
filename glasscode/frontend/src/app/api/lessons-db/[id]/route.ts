import { NextRequest, NextResponse } from "next/server";
import { getApiBaseStrict } from "@/lib/urlUtils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const apiBase = (() => {
      try {
        return getApiBaseStrict();
      } catch {
  return "http://127.0.0.1:8081";
      }
    })();
    const backendUrl = `${apiBase}/api/lessons/${id}`;
    const res = await fetch(backendUrl);
    const text = await res.text();
    let body = text;
    try {
      const parsed = JSON.parse(text);
      body = JSON.stringify(parsed?.data ?? parsed);
    } catch {}
    return new NextResponse(body, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Proxy GET /api/lessons-db/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson from backend" },
      { status: 502 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const body = await req.json();
    const { id } = await params;
    const apiBase = (() => {
      try {
        return getApiBaseStrict();
      } catch {
  return "http://127.0.0.1:8081";
      }
    })();
    const backendUrl = `${apiBase}/api/content/lessons/${id}`;
    const res = await fetch(backendUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Forward admin auth headers when present
        Authorization: req.headers.get("authorization") || "",
        "X-Admin-Token": req.headers.get("x-admin-token") || "",
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    const contentType = res.headers.get("content-type") || "application/json";
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": contentType },
    });
  } catch (error) {
    console.error("Proxy PUT /api/lessons-db/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to update lesson in backend" },
      { status: 502 },
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
