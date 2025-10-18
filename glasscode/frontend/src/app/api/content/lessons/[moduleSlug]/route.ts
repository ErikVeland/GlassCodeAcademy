import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseStrict } from '@/lib/urlUtils';

// Database-based lesson loading function
async function fetchLessonsFromDatabase(moduleSlug: string) {
  try {
    const apiBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8080/api'; } })();
    // First, get the module ID from the backend
    const modulesResponse = await fetch(`${apiBase}/modules`);
    if (!modulesResponse.ok) {
      console.error('Failed to fetch modules from backend');
      return [];
    }
    
    const modules = await modulesResponse.json();
    const foundModule = modules.find((m: { id: number; slug: string }) => m.slug === moduleSlug);
    
    if (!foundModule) {
      console.log(`Module not found for slug: ${moduleSlug}`);
      return [];
    }
    
    // Fetch lessons for this module
    const lessonsResponse = await fetch(`${apiBase}/lessons-db?moduleId=${foundModule.id}`);
    if (!lessonsResponse.ok) {
      console.error(`Failed to fetch lessons for module ${moduleSlug}`);
      return [];
    }
    
    const lessons = await lessonsResponse.json();
    console.log(`Successfully loaded ${lessons.length} lessons from database for module: ${moduleSlug}`);
    
    // Transform the database lessons to match the expected frontend format
    return lessons.map((lesson: {
      id: number;
      title: string;
      intro?: string;
      topic?: string;
      tags?: string;
      estimatedMinutes?: number;
      objectives?: string;
      codeExample?: string;
      codeExplanation?: string;
      pitfalls?: string;
      exercises?: string;
      order: number;
    }) => ({
      id: lesson.id,
      title: lesson.title,
      intro: lesson.intro,
      topic: lesson.topic || 'general',
      tags: lesson.tags ? lesson.tags.split(',').map((tag: string) => tag.trim()) : [],
      estimatedMinutes: lesson.estimatedMinutes,
      objectives: lesson.objectives ? lesson.objectives.split('\n').filter((obj: string) => obj.trim()) : [],
      code: lesson.codeExample && lesson.codeExplanation ? {
        example: lesson.codeExample,
        explanation: lesson.codeExplanation
      } : undefined,
      pitfalls: lesson.pitfalls ? JSON.parse(lesson.pitfalls) : [],
      exercises: lesson.exercises ? JSON.parse(lesson.exercises) : [],
      order: lesson.order
    }));
  } catch (error) {
    console.error('Error fetching lessons from database:', error);
    return [];
  }
}

// Add fallback JSON-backed lesson loading function
async function fetchLessonsFallbackFromJson(moduleSlug: string) {
  try {
    const bases: string[] = [];
    try {
      bases.push(getApiBaseStrict());
    } catch {
      // ignore; will use local fallbacks below
    }
    bases.push('http://127.0.0.1:8081/api', 'http://127.0.0.1:8080/api');

    for (const base of bases.map(b => b.replace(/\/+$/, ''))) {
      try {
        const resp = await fetch(`${base}/lessons?module=${moduleSlug}`);
        if (resp.ok) {
          const lessons = await resp.json();
          console.log(`Loaded ${Array.isArray(lessons) ? lessons.length : 0} lessons via JSON fallback from ${base} for ${moduleSlug}`);
          return lessons;
        } else {
          console.error(`Fallback lessons fetch failed from ${base} for module ${moduleSlug}: ${resp.status} ${resp.statusText}`);
        }
      } catch (err) {
        console.error(`Error fetching lessons via JSON fallback from ${base}:`, err);
      }
    }
    return [];
  } catch (error) {
    console.error('Error assembling JSON fallback bases:', error);
    return [];
  }
}



// Mapping from shortSlug to moduleSlug
const SHORT_SLUG_TO_MODULE_SLUG: Record<string, string> = {
  'programming': 'programming-fundamentals',
  'web': 'web-fundamentals',
  'version': 'version-control',
  'dotnet': 'dotnet-fundamentals',
  'react': 'react-fundamentals',
  'database': 'database-systems',
  'typescript': 'typescript-fundamentals',
  'node': 'node-fundamentals',
  'laravel': 'laravel-fundamentals',
  'nextjs': 'nextjs-advanced',
  'graphql': 'graphql-advanced',
  'sass': 'sass-advanced',
  'tailwind': 'tailwind-advanced',
  'vue': 'vue-advanced',
  'testing': 'testing-fundamentals',
  'performance': 'performance-optimization',
  'security': 'security-fundamentals',
  'e2e': 'e2e-testing'
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleSlug: string }> }
) {
  try {
    const { moduleSlug: inputSlug } = await params;
    console.log(`Fetching lessons for input slug: ${inputSlug}`);

    // Convert shortSlug to moduleSlug if needed
    const moduleSlug = SHORT_SLUG_TO_MODULE_SLUG[inputSlug] || inputSlug;
    console.log(`Resolved to module slug: ${moduleSlug}`);

    // Use database-based approach for all modules
    let lessons = await fetchLessonsFromDatabase(moduleSlug);

    // Fallback to JSON-backed lessons if DB returns empty or fails
    if (!lessons || lessons.length === 0) {
      console.log(`No DB lessons for ${moduleSlug}; falling back to JSON lessons`);
      lessons = await fetchLessonsFallbackFromJson(moduleSlug);
    }

    return NextResponse.json(lessons);
  } catch (error) {
    console.error('Error in lessons API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}

// Add explicit export to ensure route is handled
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';