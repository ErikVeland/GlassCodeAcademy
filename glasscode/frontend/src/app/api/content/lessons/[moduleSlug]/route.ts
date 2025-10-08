import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getGraphQLEndpoint } from '@/lib/urlUtils';

// For programming fundamentals, we'll use GraphQL to fetch data from the backend
async function fetchProgrammingLessons() {
  try {
    const graphqlEndpoint = getGraphQLEndpoint();
    
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetProgrammingLessons {
            programmingLessons {
              id
              title
            }
          }
        `,
      }),
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed with status ${response.status}`);
    }

    const result = await response.json();
    return result.data?.programmingLessons || [];
  } catch (error) {
    console.error('Failed to fetch programming lessons via GraphQL:', error);
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleSlug: string }> }
) {
  try {
    const { moduleSlug } = await params;
    console.log('Received request for module:', moduleSlug);
    
    // Special handling for programming-fundamentals module
    if (moduleSlug === 'programming-fundamentals') {
      console.log('Fetching programming lessons via GraphQL');
      const lessons = await fetchProgrammingLessons();
      console.log('GraphQL returned', lessons.length, 'lessons');
      return new Response(JSON.stringify(lessons), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400',
        },
      });
    }

    const lessonsPath = path.join(process.cwd(), '..', '..', 'content', 'lessons', `${moduleSlug}.json`);
    console.log('Looking for lessons at:', lessonsPath);
    console.log('Current working directory:', process.cwd());
    console.log('File exists:', fs.existsSync(lessonsPath));
    
    if (!fs.existsSync(lessonsPath)) {
      console.log('File not found, returning empty array');
      // Return empty array instead of error to prevent build failures
      return new Response(JSON.stringify([]), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const lessonsContent = fs.readFileSync(lessonsPath, 'utf8');
    const lessons = JSON.parse(lessonsContent);
    console.log('Found', lessons.length, 'lessons');

    return new Response(JSON.stringify(lessons), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Failed to load lessons:', error);
    // Return empty array instead of error to prevent build failures
    return new Response(JSON.stringify([]), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}