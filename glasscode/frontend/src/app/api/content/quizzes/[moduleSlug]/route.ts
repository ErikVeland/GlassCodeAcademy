import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// For programming fundamentals, we'll use GraphQL to fetch data from the backend
async function fetchProgrammingQuestions() {
  try {
    // Use environment variable for GraphQL endpoint with fallback to localhost for development
    // For production, use the local backend since we're running on the same server
    const graphqlEndpoint = process.env.NODE_ENV === 'production' 
      ? 'http://localhost:8080/graphql'  // Local backend on same server
      : 'http://localhost:5023/graphql'; // Development backend
    
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
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleSlug: string }> }
) {
  try {
    const { moduleSlug } = await params;
    
    // Special handling for programming-fundamentals module
    if (moduleSlug === 'programming-fundamentals') {
      const questions = await fetchProgrammingQuestions();
      // Transform the data to match the expected quiz format
      const quiz = {
        questions: questions
      };
      return new Response(JSON.stringify(quiz), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400',
        },
      });
    }

    const quizPath = path.join(process.cwd(), '..', '..', 'content', 'quizzes', `${moduleSlug}.json`);
    console.log('Looking for quiz at:', quizPath);
    console.log('File exists:', fs.existsSync(quizPath));
    
    if (!fs.existsSync(quizPath)) {
      // Return empty quiz object instead of error to prevent build failures
      return new Response(JSON.stringify({ questions: [] }), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const quizContent = fs.readFileSync(quizPath, 'utf8');
    const quiz = JSON.parse(quizContent);

    return new Response(JSON.stringify(quiz), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Failed to load quiz:', error);
    // Return empty quiz object instead of error to prevent build failures
    return new Response(JSON.stringify({ questions: [] }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}