import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    ver: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown'
  });
}
