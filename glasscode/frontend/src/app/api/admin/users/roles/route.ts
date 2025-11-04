import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/authOptions';
import { getApiBaseStrict } from '@/lib/urlUtils';

interface Session {
  backendToken?: string;
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
}

async function forward(req: NextRequest, method: 'POST' | 'DELETE') {
  const authOptions = getAuthOptions();
  const session = await getServerSession(authOptions);
  const token = (session as Session)?.backendToken as string | undefined;
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const apiBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8080'; } })();

    const res = await fetch(`${apiBase}/api/admin/users/roles`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': contentType } });
  } catch (error) {
    console.error(`Proxy ${method} /api/admin/users/roles failed:`, error);
    return NextResponse.json({ message: 'Failed to update user roles' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  return forward(req, 'POST');
}

export async function DELETE(req: NextRequest) {
  return forward(req, 'DELETE');
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';