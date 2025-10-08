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
              topic
              title
              description
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
    // During build time, the backend might not be available
    // Return a minimal set of lessons to allow build to complete
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Build phase detected, returning minimal lesson data');
      return [
        { id: 1, title: 'Variables and Data Types', topic: 'basics', description: 'Learn about variables and data types' },
        { id: 2, title: 'Control Structures', topic: 'basics', description: 'Learn about control structures' },
        { id: 3, title: 'Functions', topic: 'basics', description: 'Learn about functions' },
        { id: 4, title: 'Arrays and Objects', topic: 'data-structures', description: 'Learn about arrays and objects' },
        { id: 5, title: 'Object-Oriented Programming', topic: 'data-structures', description: 'Learn about OOP' },
        { id: 6, title: 'Error Handling', topic: 'error-handling', description: 'Learn about error handling' },
        { id: 7, title: 'File Operations', topic: 'error-handling', description: 'Learn about file operations' },
        { id: 8, title: 'Recursion', topic: 'algorithms', description: 'Learn about recursion' },
        { id: 9, title: 'Sorting Algorithms', topic: 'algorithms', description: 'Learn about sorting algorithms' },
        { id: 10, title: 'Memory Management', topic: 'advanced', description: 'Learn about memory management' },
        { id: 11, title: 'Best Practices', topic: 'advanced', description: 'Learn about best practices' },
        { id: 12, title: 'Project Organization', topic: 'advanced', description: 'Learn about project organization' }
      ];
    }
    return [];
  }
}

// Function to find lesson file in multiple possible locations
function findLessonFile(moduleSlug: string): string | null {
  // Try to find the lesson file in different possible locations
  const possiblePaths = [
    path.join(process.cwd(), '..', '..', 'content', 'lessons', `${moduleSlug}.json`),
    path.join(process.cwd(), 'content', 'lessons', `${moduleSlug}.json`),
    path.join(__dirname, '..', '..', '..', '..', 'content', 'lessons', `${moduleSlug}.json`),
    path.join('/srv/academy', 'content', 'lessons', `${moduleSlug}.json`),
  ];
  
  console.log('Searching for lesson file:', moduleSlug);
  console.log('Current working directory:', process.cwd());
  
  for (const lessonPath of possiblePaths) {
    try {
      const exists = fs.existsSync(lessonPath);
      console.log(`Checking path: ${lessonPath} - ${exists ? 'FOUND' : 'NOT FOUND'}`);
      if (exists) {
        return lessonPath;
      }
    } catch (err) {
      console.error(`Error checking ${lessonPath}:`, err);
      // Continue to next path
    }
  }
  
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleSlug: string }> }
) {
  try {
    const { moduleSlug } = await params;
    console.log('=== Lesson API Route ===');
    console.log('Received request for module:', moduleSlug);
    
    // Special handling for programming-fundamentals module
    if (moduleSlug === 'programming-fundamentals') {
      console.log('Fetching programming lessons via GraphQL');
      const lessons = await fetchProgrammingLessons();
      console.log('GraphQL returned', lessons.length, 'lessons');
      return new Response(JSON.stringify(lessons), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400',
        },
      });
    }

    // Try to find the lesson file
    const lessonsPath = findLessonFile(moduleSlug);
    
    if (!lessonsPath) {
      console.log(`Lesson file not found for module: ${moduleSlug}`);
      // Return empty array with proper JSON content type
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    console.log('Looking for lessons at:', lessonsPath);
    console.log('File exists:', fs.existsSync(lessonsPath));
    
    const lessonsContent = fs.readFileSync(lessonsPath, 'utf8');
    const lessons = JSON.parse(lessonsContent);
    console.log('Found', lessons.length, 'lessons');

    return new Response(JSON.stringify(lessons), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Failed to load lessons:', error);
    // Return empty array with proper JSON content type and 200 status
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// Add explicit export to ensure route is handled
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';