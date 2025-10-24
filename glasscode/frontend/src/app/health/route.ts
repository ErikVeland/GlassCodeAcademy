import { NextResponse } from 'next/server';
import { getApiBaseStrict } from '@/lib/urlUtils';

export async function GET() {
  try {
    const apiBase = (() => {
      try {
        return getApiBaseStrict().replace(/\/+$/, '');
      } catch {
        // Fallback to local backend port used in deployment
        return 'http://127.0.0.1:8080';
      }
    })();

    const res = await fetch(`${apiBase}/health`, { cache: 'no-store' });
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';

    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': contentType },
    });
  } catch (error) {
    console.error('Proxy GET /health failed:', error);
    return NextResponse.json({ success: false, error: 'Backend health unreachable' }, { status: 502 });
  }
}