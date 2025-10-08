import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// For programming fundamentals, we'll use GraphQL to fetch data from the backend
async function fetchProgrammingQuestions() {
  try {
    const response = await fetch('http://localhost:5023/graphql', {
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
      return new Response(JSON.stringify({ error: `Quiz not found for module: ${moduleSlug}` }), {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 404,
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
    return new Response(JSON.stringify({ error: 'Failed to load quiz' }), {
      headers: {
        'Content-Type': 'application/json',
      },
      status: 500,
    });
  }
}