import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseStrict } from '@/lib/urlUtils';
import { proxyJsonResponse, retryFetch } from '@/lib/httpUtils';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function getNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const lessonIdParam = url.searchParams.get('lessonId');
    if (!lessonIdParam) {
      return NextResponse.json({ error: 'lessonId query param is required' }, { status: 400 });
    }
    const lessonIdNumeric = Number(lessonIdParam);
    if (!Number.isFinite(lessonIdNumeric) || lessonIdNumeric <= 0) {
      return NextResponse.json({ error: 'lessonId must be a positive number' }, { status: 400 });
    }
    const apiBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8080'; } })();

    // Try public lesson quizzes endpoint first
    const publicUrl = `${apiBase}/api/lessons/${lessonIdNumeric}/quizzes`;
    const publicRes = await retryFetch(publicUrl, { cache: 'no-store', headers: { 'Content-Type': 'application/json' } }, 3, 250);
    const { body: publicData } = await proxyJsonResponse(publicRes);

    if (Array.isArray(publicData) && publicData.length > 0) {
      return new NextResponse(JSON.stringify(publicData), { status: publicRes.status, headers: { 'Content-Type': 'application/json' } });
    }

    // Fallback: derive module slug from lesson, then fetch module quizzes
    const lessonRes = await retryFetch(`${apiBase}/api/lessons/${lessonIdNumeric}`, { cache: 'no-store', headers: { 'Content-Type': 'application/json' } }, 3, 250);
    const { body: lessonData } = await proxyJsonResponse(lessonRes);
    const moduleId = isRecord(lessonData)
      ? getNumber(lessonData.moduleId) ?? getNumber(lessonData.module_id)
      : undefined;

    if (!moduleId) {
      // If no module context, return what we got (likely empty)
      return new NextResponse(JSON.stringify(publicData ?? []), { status: publicRes.status, headers: { 'Content-Type': 'application/json' } });
    }

    const moduleRes = await retryFetch(`${apiBase}/api/modules/${moduleId}`, { cache: 'no-store', headers: { 'Content-Type': 'application/json' } }, 3, 250);
    const { body: moduleData } = await proxyJsonResponse(moduleRes);
    const moduleSlug = isRecord(moduleData)
      ? getString(moduleData.slug) ?? getString(moduleData.shortSlug) ?? getString(moduleData.moduleSlug)
      : undefined;

    if (!moduleSlug) {
      return new NextResponse(JSON.stringify(publicData ?? []), { status: publicRes.status, headers: { 'Content-Type': 'application/json' } });
    }

    const moduleQuizRes = await retryFetch(`${apiBase}/api/modules/${moduleSlug}/quiz`, { cache: 'no-store', headers: { 'Content-Type': 'application/json' } }, 3, 250);
    const { body: moduleQuizData } = await proxyJsonResponse(moduleQuizRes);

    return new NextResponse(JSON.stringify(Array.isArray(moduleQuizData) ? moduleQuizData : []), { status: moduleQuizRes.status, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Proxy GET /api/LessonQuiz failed:', error);
    return NextResponse.json({ error: 'Failed to fetch quizzes from backend' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody: unknown = await req.json();
    const lessonId = isRecord(rawBody) ? getNumber(rawBody.lessonId) : undefined;
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
      body: JSON.stringify(rawBody),
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