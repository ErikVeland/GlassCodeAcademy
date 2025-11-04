import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseStrict } from '@/lib/urlUtils';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const lessonId = url.searchParams.get('lessonId');
    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId query param is required' }, { status: 400 });
    }
    const apiBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8080'; } })();
    const backendUrl = `${apiBase}/api/content/lessons/${lessonId}/quizzes`;
    const res = await fetch(backendUrl);
    const text = await res.text();
    let body = text;
    try {
      const parsed = JSON.parse(text);
      body = JSON.stringify(Array.isArray(parsed) ? parsed : parsed?.data ?? parsed);
    } catch {}
    return new NextResponse(body, { status: res.status, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Proxy GET /api/LessonQuiz failed:', error);
    return NextResponse.json({ error: 'Failed to fetch quizzes from backend' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lessonId = body?.lessonId;
    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId is required in request body' }, { status: 400 });
    }
    const apiBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8080'; } })();
    const res = await fetch(`${apiBase}/api/content/lessons/${lessonId}/quizzes`, {
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