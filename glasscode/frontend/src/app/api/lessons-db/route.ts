import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseStrict } from '@/lib/urlUtils';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = url.search || '';
    const apiBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8080'; } })();
    const backendUrl = `${apiBase}/api/lessons-db${query}`;

    console.log('[api/lessons-db] Proxying GET to:', backendUrl);

    const res = await fetch(backendUrl, { cache: 'no-store' });
    const text = await res.text();

    console.log('[api/lessons-db] Backend status:', res.status);
    console.log('[api/lessons-db] Backend content-type:', res.headers.get('content-type'));

    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': contentType } });
  } catch (error) {
    console.error('Proxy GET /api/lessons-db failed:', error);
    return NextResponse.json({ error: 'Failed to fetch lessons from backend' }, { status: 502 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';