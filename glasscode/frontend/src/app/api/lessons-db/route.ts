import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseStrict } from '@/lib/urlUtils';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = url.search || '';
    const apiBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8080'; } })();
    const backendUrl = `${apiBase}/api/lessons-db${query}`;
    const res = await fetch(backendUrl);
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': contentType } });
  } catch (error) {
    console.error('Proxy GET /api/lessons-db failed:', error);
    return NextResponse.json({ error: 'Failed to fetch lessons from backend' }, { status: 502 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';