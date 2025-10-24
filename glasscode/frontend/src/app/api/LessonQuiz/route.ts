import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseStrict } from '@/lib/urlUtils';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = url.search || '';
    const apiBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8080'; } })();
    const backendUrl = `${apiBase}/api/LessonQuiz${query}`;
    const res = await fetch(backendUrl);
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': contentType } });
  } catch (error) {
    console.error('Proxy GET /api/LessonQuiz failed:', error);
    return NextResponse.json({ error: 'Failed to fetch quizzes from backend' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8081'; } })();
    const res = await fetch(`${apiBase}/api/LessonQuiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Forward admin auth headers when present
        'Authorization': req.headers.get('authorization') || '',
        'X-Admin-Token': req.headers.get('x-admin-token') || '',
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': contentType } });
  } catch (error) {
    console.error('Proxy POST /api/LessonQuiz failed:', error);
    return NextResponse.json({ error: 'Failed to create quiz in backend' }, { status: 502 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';