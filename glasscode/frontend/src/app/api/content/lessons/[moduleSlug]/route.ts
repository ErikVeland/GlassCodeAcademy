import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseStrict } from '@/lib/urlUtils';

// Database-based lesson loading function
async function fetchLessonsFromDatabase(moduleSlug: string) {
  try {
    const apiBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8080'; } })();
    // First, get the module ID from the backend
    const modulesResponse = await fetch(`${apiBase}/api/modules`);
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
    const lessonsResponse = await fetch(`${apiBase}/api/lessons-db?moduleId=${foundModule.id}`);
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
      additionalNotes?: string;
      difficulty?: string;
    }) => ({
      id: `${lesson.id}`,
      title: lesson.title,
      intro: lesson.intro || '',
      topic: lesson.topic || '',
      tags: lesson.tags ? lesson.tags.split(',').map((t: string) => t.trim()) : [],
      estimatedMinutes: lesson.estimatedMinutes || 10,
      objectives: lesson.objectives ? lesson.objectives.split('\n') : [],
      codeExample: lesson.codeExample || '',
      codeExplanation: lesson.codeExplanation || '',
      additionalNotes: lesson.additionalNotes || '',
      difficulty: (lesson.difficulty || 'beginner') as 'beginner' | 'intermediate' | 'advanced',
    }));
  } catch (error) {
    console.error('Error loading lessons from database:', error);
    return [];
  }
}

// File-based lesson loading fallback
async function fetchLessonsFromFiles(moduleSlug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/content/lessons/${moduleSlug}.json`, { cache: 'no-store' });
    if (!res.ok) {
      console.warn(`Failed to fetch lessons file for module: ${moduleSlug}`);
      return [];
    }
    const data = await res.json();
    return data.lessons || [];
  } catch (error) {
    console.error('Error loading lessons from files:', error);
    return [];
  }
}

// Map short slugs to full module slugs (e.g., graphql -> GraphQL queries)
const SHORT_SLUG_TO_MODULE_SLUG: Record<string, string> = {
  graphql: 'graphql',
  js: 'javascript',
  ts: 'typescript',
  next: 'nextjs',
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ moduleSlug: string }> }) {
  const { moduleSlug } = await params;
  const actualSlug = SHORT_SLUG_TO_MODULE_SLUG[moduleSlug] || moduleSlug;

  // Try database mode first if GC_CONTENT_MODE is 'db'
  const contentMode = (process.env.GC_CONTENT_MODE || 'file').toLowerCase();
  let lessons: unknown[] = [];

  if (contentMode === 'db') {
    lessons = await fetchLessonsFromDatabase(actualSlug);
  }

  // Fallback to file-based lessons if DB loading produced no results
  if (!lessons || lessons.length === 0) {
    lessons = await fetchLessonsFromFiles(actualSlug);
  }

  return NextResponse.json({ lessons });
}

export const runtime = 'edge';
export const dynamic = 'force-dynamic';