import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseStrict } from '@/lib/urlUtils';

// Proxy /graphql to backend GraphQL endpoint without hardcoded host
const getBackendGraphQLEndpoint = () => {
  const base = getApiBaseStrict();
  return `${base}/graphql`;
};

export async function OPTIONS() {
  // CORS preflight response
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
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
        ...(req.headers.get('authorization') ? { authorization: req.headers.get('authorization')! } : {}),
      },
      body,
    });

    const text = await res.text();

    // Pass through status and content-type from backend
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, {
      status: res.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('GraphQL proxy error:', error);
    return NextResponse.json({ error: 'GraphQL proxy failed. Ensure NEXT_PUBLIC_API_BASE is set.' }, { status: 502 });
  }
}

export async function GET() {
  // Optional: provide a simple health response for GET requests
  return NextResponse.json({ status: 'ok', proxiedTo: getBackendGraphQLEndpoint() });
}