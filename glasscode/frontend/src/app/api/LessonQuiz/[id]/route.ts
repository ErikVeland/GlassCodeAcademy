import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseStrict } from '@/lib/urlUtils';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const apiBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8080'; } })();
    const backendUrl = `${apiBase}/api/LessonQuiz/${id}`;
    const res = await fetch(backendUrl);
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': contentType } });
  } catch (error) {
    console.error('Proxy GET /api/LessonQuiz/[id] failed:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz from backend' }, { status: 502 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const { id } = await params;
    const apiBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8080'; } })();
    const backendUrl = `${apiBase}/api/LessonQuiz/${id}`;
    const res = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': contentType } });
  } catch (error) {
    console.error('Proxy PUT /api/LessonQuiz/[id] failed:', error);
    return NextResponse.json({ error: 'Failed to update quiz in backend' }, { status: 502 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const apiBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8080'; } })();
    const backendUrl = `${apiBase}/api/LessonQuiz/${id}`;
    const res = await fetch(backendUrl, { method: 'DELETE' });
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': contentType } });
  } catch (error) {
    console.error('Proxy DELETE /api/LessonQuiz/[id] failed:', error);
    return NextResponse.json({ error: 'Failed to delete quiz in backend' }, { status: 502 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';