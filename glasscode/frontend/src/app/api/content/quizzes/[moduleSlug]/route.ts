import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getGraphQLEndpoint } from '@/lib/urlUtils';

// For programming fundamentals, we'll use GraphQL to fetch data from the backend
async function fetchProgrammingQuestions() {
  try {
    const graphqlEndpoint = getGraphQLEndpoint();
    
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetProgrammingQuestions {
            programmingInterviewQuestions {
              id
              topic
              type
              question
              choices
              correctAnswer
              explanation
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
    return result.data?.programmingInterviewQuestions || [];
  } catch (error) {
    console.error('Failed to fetch programming questions via GraphQL:', error);
    // During build time, the backend might not be available
    // Return a minimal set of questions to allow build to complete
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Build phase detected, returning minimal question data');
      return [
        { id: 1, topic: 'basics', type: 'multiple-choice', question: 'What is a variable?', choices: ['A storage location', 'A function', 'A loop', 'A class'], correctAnswer: 0, explanation: 'A variable is a storage location paired with an associated symbolic name.' },
        { id: 2, topic: 'basics', type: 'multiple-choice', question: 'What is a function?', choices: ['A storage location', 'A reusable block of code', 'A loop', 'A class'], correctAnswer: 1, explanation: 'A function is a reusable block of code that performs a specific task.' },
        { id: 3, topic: 'data-structures', type: 'multiple-choice', question: 'What is an array?', choices: ['A single value', 'A collection of elements', 'A function', 'A class'], correctAnswer: 1, explanation: 'An array is a collection of elements, each identified by an array index.' }
      ];
    }
    return [];
  }
}

// Function to find quiz file in multiple possible locations
function findQuizFile(moduleSlug: string): string | null {
  // Try to find the quiz file in different possible locations
  const possiblePaths = [
    path.join(process.cwd(), '..', '..', 'content', 'quizzes', `${moduleSlug}.json`),
    path.join(process.cwd(), 'content', 'quizzes', `${moduleSlug}.json`),
    path.join(__dirname, '..', '..', '..', '..', 'content', 'quizzes', `${moduleSlug}.json`),
    path.join('/srv/academy', 'content', 'quizzes', `${moduleSlug}.json`),
  ];
  
  console.log('Searching for quiz file:', moduleSlug);
  console.log('Current working directory:', process.cwd());
  
  for (const quizPath of possiblePaths) {
    try {
      const exists = fs.existsSync(quizPath);
      console.log(`Checking path: ${quizPath} - ${exists ? 'FOUND' : 'NOT FOUND'}`);
      if (exists) {
        return quizPath;
      }
    } catch (err) {
      console.error(`Error checking ${quizPath}:`, err);
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
    console.log('=== Quiz API Route ===');
    console.log('Received request for quiz module:', moduleSlug);
    
    // Special handling for programming-fundamentals module
  if (moduleSlug === 'programming-fundamentals') {
      console.log('Fetching programming questions via GraphQL');
      try {
        const questions = await fetchProgrammingQuestions();
        console.log('GraphQL returned', questions.length, 'questions');
        return new Response(JSON.stringify({ questions }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400',
          },
        });
      } catch (err) {
        console.error('GraphQL failed, serving minimal stub for programming-fundamentals:', err);
        const stub = {
          questions: [
            { id: 1, topic: 'basics', type: 'multiple-choice', question: 'What is a variable?', choices: ['A storage location', 'A function', 'A loop', 'A class'], correctAnswer: 0, explanation: 'A variable is a storage location paired with an associated symbolic name.' },
            { id: 2, topic: 'basics', type: 'multiple-choice', question: 'What is a function?', choices: ['A storage location', 'A reusable block of code', 'A loop', 'A class'], correctAnswer: 1, explanation: 'A function is a reusable block of code that performs a specific task.' },
            { id: 3, topic: 'data-structures', type: 'multiple-choice', question: 'What is an array?', choices: ['A single value', 'A collection of elements', 'A function', 'A class'], correctAnswer: 1, explanation: 'An array is a collection of elements, each identified by an array index.' }
          ]
        };
        return new Response(JSON.stringify(stub), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    }

    // Try to find the quiz file
    const quizPath = findQuizFile(moduleSlug);
    
    if (!quizPath) {
      console.log(`Quiz file not found for module: ${moduleSlug}`);
      // Return empty quiz with proper JSON content type
      return new Response(JSON.stringify({ questions: [] }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    console.log('Looking for quiz at:', quizPath);
    console.log('File exists:', fs.existsSync(quizPath));
    
    const quizContent = fs.readFileSync(quizPath, 'utf8');
    const quiz = JSON.parse(quizContent);
    console.log('Found', quiz.questions?.length || 0, 'questions');

    return new Response(JSON.stringify(quiz), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Failed to load quiz:', error);
    // Return empty quiz with proper JSON content type and 200 status
    return new Response(JSON.stringify({ questions: [] }), {
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