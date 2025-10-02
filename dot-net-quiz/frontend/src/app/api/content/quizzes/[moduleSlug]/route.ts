import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleSlug: string }> }
) {
  try {
    const { moduleSlug } = await params;
    const quizPath = path.join(process.cwd(), '..', '..', 'content', 'quizzes', `${moduleSlug}.json`);
    
    if (!fs.existsSync(quizPath)) {
      return NextResponse.json(
        { error: `Quiz not found for module: ${moduleSlug}` },
        { status: 404 }
      );
    }

    const quizContent = fs.readFileSync(quizPath, 'utf8');
    const quiz = JSON.parse(quizContent);

    return NextResponse.json(quiz, {
      headers: {
        'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Failed to load quiz:', error);
    return NextResponse.json(
      { error: 'Failed to load quiz' },
      { status: 500 }
    );
  }
}