import { NextRequest, NextResponse } from "next/server";

// Accept CSP violation reports from browsers.
// Supports both legacy Content Security Policy reports and Reporting API formats.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let report: any = null;

    // Reporting API format: application/reports+json
    if (contentType.includes("application/reports+json")) {
      report = await req.json();
    } else {
      // Legacy CSP report: application/csp-report or application/json
      report = await req.json();
    }

    // Limit size to avoid noisy logs
    const preview = (() => {
      try {
        return JSON.stringify(report).slice(0, 5000);
      } catch {
        return "[unserializable report]";
      }
    })();

    console.error("[CSP Report]", preview);

    // No content response for report endpoints
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Failed to parse CSP report:", err);
    return NextResponse.json({ error: "Invalid CSP report" }, { status: 400 });
  }
}

export async function GET() {
  // Optional: surface endpoint status for health checks
  return NextResponse.json({ status: "ok" });
}
