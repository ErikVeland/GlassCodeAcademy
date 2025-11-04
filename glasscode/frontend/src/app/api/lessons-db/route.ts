import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseStrict } from '@/lib/urlUtils';

export async function GET(req: NextRequest) {
  try {
    const apiBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8080'; } })();
    type ModuleItem = { id?: string; moduleId?: string } | string;
    type JsonArray = Record<string, unknown>[];
    // Fetch all modules first
    const modulesRes = await fetch(`${apiBase}/api/modules`, { 
      cache: 'no-store',
      headers: { 'Authorization': req.headers.get('authorization') || '' }
    });
    const modulesText = await modulesRes.text();
    let modules: ModuleItem[] = [];
    try {
      const parsed = JSON.parse(modulesText);
      modules = (Array.isArray(parsed) ? parsed : parsed?.data ?? []) as ModuleItem[];
    } catch {
      modules = [];
    }

    // For each module, fetch its lessons
    const lessonsArrays = await Promise.all(
      modules.map(async (m: ModuleItem) => {
        const id = typeof m === 'string' ? m : (m.id ?? m.moduleId);
        if (!id) return [];
        try {
          const res = await fetch(`${apiBase}/api/modules/${id}/lessons`, { 
            cache: 'no-store',
            headers: { 'Authorization': req.headers.get('authorization') || '' }
          });
          const txt = await res.text();
          const parsed = JSON.parse(txt);
          return (Array.isArray(parsed) ? parsed : parsed?.data ?? []) as JsonArray;
        } catch {
          return [];
        }
      })
    );

    const allLessons: JsonArray = lessonsArrays.flat();
    return NextResponse.json(allLessons, { status: 200 });
  } catch (error) {
    console.error('Aggregator GET /api/lessons-db failed:', error);
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 502 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';