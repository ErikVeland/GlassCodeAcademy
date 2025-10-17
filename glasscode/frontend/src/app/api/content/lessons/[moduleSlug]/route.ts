import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// File-based lesson loading function
async function fetchLessonsFromFile(moduleSlug: string) {
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'content', 'lessons', `${moduleSlug}.json`),
    path.join(process.cwd(), 'src', 'data', 'lessons', `${moduleSlug}.json`),
    path.join(process.cwd(), 'data', 'lessons', `${moduleSlug}.json`),
    path.join(process.cwd(), 'content', 'lessons', `${moduleSlug}.json`)
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lessons = JSON.parse(fileContent);
        console.log(`Successfully loaded ${lessons.length} lessons from ${filePath}`);
        return lessons;
      } catch (error) {
        console.error(`Error reading lesson file ${filePath}:`, error);
        continue;
      }
    }
  }

  console.log(`No lesson file found for module: ${moduleSlug}`);
  return [];
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

    // Use file-based approach for all modules
    const lessons = await fetchLessonsFromFile(moduleSlug);

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