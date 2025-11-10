import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseStrict } from '@/lib/urlUtils';

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function unwrapData<T = unknown>(value: unknown): T | unknown {
  if (Array.isArray(value)) return value;
  if (isRecord(value) && 'data' in value) {
    const data = (value as { data?: unknown }).data;
    return data as T;
  }
  return value as T;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const apiBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8080'; } })();
    const backendUrl = `${apiBase}/api/content/quizzes/${id}`;
    const res = await fetch(backendUrl);
    const parsed = safeParseJson(await res.text());
    const unwrapped = unwrapData(parsed);
    const body = typeof unwrapped === 'string' ? unwrapped : JSON.stringify(unwrapped);
    return new NextResponse(body, { status: res.status, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Proxy GET /api/LessonQuiz/[id] failed:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz from backend' }, { status: 502 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body: unknown = await req.json();
    const { id } = await params;
    const apiBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8080'; } })();
    const backendUrl = `${apiBase}/api/content/quizzes/${id}`;
    const res = await fetch(backendUrl, {
      method: 'PUT',
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
    console.error('Proxy PUT /api/LessonQuiz/[id] failed:', error);
    return NextResponse.json({ error: 'Failed to update quiz in backend' }, { status: 502 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const apiBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8080'; } })();
    const backendUrl = `${apiBase}/api/content/quizzes/${id}`;
    const res = await fetch(backendUrl, {
      method: 'DELETE',
      // Forward admin auth headers when present
      headers: {
        'Authorization': _req.headers.get('authorization') || '',
        'X-Admin-Token': _req.headers.get('x-admin-token') || '',
      }
    });
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