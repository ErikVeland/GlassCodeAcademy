import { getServerSession } from 'next-auth';
import { getAuthOptions } from '../[...nextauth]/route';

export async function GET() {
  const authOptions = getAuthOptions();
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new Response(JSON.stringify({ message: 'No session found' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(session), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';