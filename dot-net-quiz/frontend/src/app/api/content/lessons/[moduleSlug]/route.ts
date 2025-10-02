import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleSlug: string }> }
) {
  try {
    const { moduleSlug } = await params;
    const lessonsPath = path.join(process.cwd(), '..', '..', 'content', 'lessons', `${moduleSlug}.json`);
    
    if (!fs.existsSync(lessonsPath)) {
      return NextResponse.json(
        { error: `Lessons not found for module: ${moduleSlug}` },
        { status: 404 }
      );
    }

    const lessonsContent = fs.readFileSync(lessonsPath, 'utf8');
    const lessons = JSON.parse(lessonsContent);

    return NextResponse.json(lessons, {
      headers: {
        'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Failed to load lessons:', error);
    return NextResponse.json(
      { error: 'Failed to load lessons' },
      { status: 500 }
    );
  }
}