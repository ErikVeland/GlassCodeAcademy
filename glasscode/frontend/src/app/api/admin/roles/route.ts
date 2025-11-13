import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/authOptions";
import { getApiBaseStrict } from "@/lib/urlUtils";

interface Session {
  backendToken?: string;
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
}

export async function GET(req: NextRequest) {
  try {
    const authOptions = getAuthOptions();
    const session = await getServerSession(authOptions);
    const token = (session as Session)?.backendToken as string | undefined;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const apiBase = (() => {
      try {
        return getApiBaseStrict();
      } catch {
  return "http://127.0.0.1:8081";
      }
    })();
    const url = new URL(req.url);
    const query = url.search || "";
    const backendUrl = `${apiBase}/api/admin/roles${query}`;

    const res = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const text = await res.text();
    const contentType = res.headers.get("content-type") || "application/json";
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": contentType },
    });
  } catch (error) {
    console.error("Proxy GET /api/admin/roles failed:", error);
    return NextResponse.json(
      { message: "Failed to fetch roles" },
      { status: 502 },
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
