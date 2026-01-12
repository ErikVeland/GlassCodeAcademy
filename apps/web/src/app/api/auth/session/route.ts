import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/authOptions';
// Session endpoint: returns current session object or null for unauthenticated

export async function GET() {
  try {
    const authOptions = getAuthOptions();
    const session = await getServerSession(authOptions);
    const body = session ?? { user: null, expires: null };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch {
    // Return 200 with an empty session shape to satisfy client expectations
    return new Response(JSON.stringify({ user: null, expires: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
