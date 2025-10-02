import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const registryPath = path.join(process.cwd(), '..', '..', 'content', 'registry.json');
    
    if (!fs.existsSync(registryPath)) {
      return NextResponse.json(
        { error: 'Content registry not found' },
        { status: 404 }
      );
    }

    const registryContent = fs.readFileSync(registryPath, 'utf8');
    const registry = JSON.parse(registryContent);

    return NextResponse.json(registry, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Failed to load content registry:', error);
    return NextResponse.json(
      { error: 'Failed to load content registry' },
      { status: 500 }
    );
  }
}