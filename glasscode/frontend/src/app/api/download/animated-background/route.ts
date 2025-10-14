import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const projectRoot = process.cwd();
    const componentPath = path.join(projectRoot, 'src', 'components', 'AnimatedBackground.tsx');

    const fileExists = fs.existsSync(componentPath);
    if (!fileExists) {
      return NextResponse.json({ error: 'Component file not found.' }, { status: 404 });
    }

    const fileContent = fs.readFileSync(componentPath, 'utf-8');

    return new Response(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="AnimatedBackground.tsx"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    console.error('Failed to read AnimatedBackground component file:', error);
    return NextResponse.json({ error: 'Failed to read component file.' }, { status: 500 });
  }
}