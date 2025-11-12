import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/authOptions";

export async function GET() {
  try {
    const authOptions = getAuthOptions();
    const session = await getServerSession(authOptions);
    return new Response(JSON.stringify(session ?? null), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Return 200 with null to satisfy NextAuth client expectations
    return new Response(JSON.stringify(null), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
