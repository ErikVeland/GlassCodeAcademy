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

    // Try public lesson quizzes endpoint first
    const publicUrl = `${apiBase}/api/lessons/${lessonId}/quizzes`;
    const publicRes = await fetch(publicUrl, { cache: 'no-store', headers: { 'Content-Type': 'application/json' } });
    const publicText = await publicRes.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let publicParsed: any;
    try { publicParsed = JSON.parse(publicText); } catch { publicParsed = publicText; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const publicData = Array.isArray(publicParsed) ? publicParsed : (publicParsed as any)?.data ?? publicParsed;

    if (Array.isArray(publicData) && publicData.length > 0) {
      return new NextResponse(JSON.stringify(publicData), { status: publicRes.status, headers: { 'Content-Type': 'application/json' } });
    }

    // Fallback: derive module slug from lesson, then fetch module quizzes
    const lessonRes = await fetch(`${apiBase}/api/lessons/${lessonId}`, { cache: 'no-store', headers: { 'Content-Type': 'application/json' } });
    const lessonText = await lessonRes.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lessonParsed: any;
    try { lessonParsed = JSON.parse(lessonText); } catch { lessonParsed = lessonText; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lessonData: any = (lessonParsed as any)?.data ?? lessonParsed;
    const moduleId = lessonData?.moduleId ?? lessonData?.module_id;

    if (!moduleId) {
      // If no module context, return what we got (likely empty)
      return new NextResponse(JSON.stringify(publicData ?? []), { status: publicRes.status, headers: { 'Content-Type': 'application/json' } });
    }

    const moduleRes = await fetch(`${apiBase}/api/modules/${moduleId}`, { cache: 'no-store', headers: { 'Content-Type': 'application/json' } });
    const moduleText = await moduleRes.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let moduleParsed: any;
    try { moduleParsed = JSON.parse(moduleText); } catch { moduleParsed = moduleText; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const moduleData: any = (moduleParsed as any)?.data ?? moduleParsed;
    const moduleSlug = moduleData?.slug ?? moduleData?.shortSlug ?? moduleData?.moduleSlug;

    if (!moduleSlug) {
      return new NextResponse(JSON.stringify(publicData ?? []), { status: publicRes.status, headers: { 'Content-Type': 'application/json' } });
    }

    const moduleQuizRes = await fetch(`${apiBase}/api/modules/${moduleSlug}/quiz`, { cache: 'no-store', headers: { 'Content-Type': 'application/json' } });
    const moduleQuizText = await moduleQuizRes.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let moduleQuizParsed: any;
    try { moduleQuizParsed = JSON.parse(moduleQuizText); } catch { moduleQuizParsed = moduleQuizText; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const moduleQuizData = Array.isArray(moduleQuizParsed) ? moduleQuizParsed : (moduleQuizParsed as any)?.data ?? moduleQuizParsed;

    return new NextResponse(JSON.stringify(Array.isArray(moduleQuizData) ? moduleQuizData : []), { status: moduleQuizRes.status, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Proxy GET /api/LessonQuiz failed:', error);
    return NextResponse.json({ error: 'Failed to fetch quizzes from backend' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await req.json();
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