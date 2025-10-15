import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleSlug: string }> }
) {
  try {
    const { moduleSlug } = await params;
    
    // Try to read from the public/content directory first (build artifacts)
    const publicSourcesPath = path.join(process.cwd(), 'public', 'content', 'lessons', moduleSlug, 'sources.json');
    
    // Fallback to the root content directory (source files)
    const rootSourcesPath = path.join(process.cwd(), '..', '..', 'content', 'lessons', moduleSlug, 'sources.json');
    
    let sourcesPath = publicSourcesPath;
    if (!fs.existsSync(publicSourcesPath) && fs.existsSync(rootSourcesPath)) {
      sourcesPath = rootSourcesPath;
    }
    
    if (!fs.existsSync(sourcesPath)) {
      return NextResponse.json(
        { error: `Sources not found for module: ${moduleSlug}` },
        { status: 404 }
      );
    }
    
    const sourcesData = fs.readFileSync(sourcesPath, 'utf-8');
    const sources = JSON.parse(sourcesData);
    
    return NextResponse.json(sources);
  } catch (error) {
    console.error('Error reading sources:', error);
    return NextResponse.json(
      { error: 'Failed to read sources' },
      { status: 500 }
    );
  }
}