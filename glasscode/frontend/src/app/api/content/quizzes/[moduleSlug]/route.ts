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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleSlug: string }> }
) {
  try {
    const { moduleSlug } = await params;
    console.log('Received request for quiz module:', moduleSlug);
    
    // Special handling for programming-fundamentals module
    if (moduleSlug === 'programming-fundamentals') {
      console.log('Fetching programming questions via GraphQL');
      const questions = await fetchProgrammingQuestions();
      console.log('GraphQL returned', questions.length, 'questions');
      return new Response(JSON.stringify({ questions }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400',
        },
      });
    }

    const quizPath = path.join(process.cwd(), '..', '..', 'content', 'quizzes', `${moduleSlug}.json`);
    console.log('Looking for quiz at:', quizPath);
    console.log('Current working directory:', process.cwd());
    console.log('File exists:', fs.existsSync(quizPath));
    
    if (!fs.existsSync(quizPath)) {
      console.log('File not found, returning empty quiz');
      // Return empty quiz instead of error to prevent build failures
      return new Response(JSON.stringify({ questions: [] }), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const quizContent = fs.readFileSync(quizPath, 'utf8');
    const quiz = JSON.parse(quizContent);
    console.log('Found', quiz.questions?.length || 0, 'questions');

    return new Response(JSON.stringify(quiz), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Failed to load quiz:', error);
    // Return empty quiz instead of error to prevent build failures
    return new Response(JSON.stringify({ questions: [] }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}