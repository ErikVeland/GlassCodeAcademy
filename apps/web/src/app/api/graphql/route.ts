import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseStrict } from '@/lib/urlUtils';

// Proxy /graphql to backend GraphQL endpoint without hardcoded host
const getBackendGraphQLEndpoint = () => {
  const base = getApiBaseStrict();
  return `${base}/graphql`;
};

// Lock CORS to the configured public origin; fall back to same-origin only
const getAllowedOrigin = () =>
  (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/+$/, '') || null;

export async function OPTIONS() {
  const origin = getAllowedOrigin();
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const backendUrl = getBackendGraphQLEndpoint();
    const body = await req.text();

    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Pass through auth headers if present
        ...(req.headers.get('authorization')
          ? { authorization: req.headers.get('authorization')! }
          : {}),
      },
      body,
    });

    const text = await res.text();
    const origin = getAllowedOrigin();

    // Pass through status and content-type from backend
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, {
      status: res.status,
      headers: {
        'Content-Type': contentType,
        ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
      },
    });
  } catch (error) {
    console.error('GraphQL proxy error:', error);
    return NextResponse.json(
      { error: 'GraphQL proxy failed. Ensure NEXT_PUBLIC_API_BASE is set.' },
      { status: 502 }
    );
  }
}
