// Use the Web Request type to satisfy Next.js route handler typing
import fs from 'fs';
import path from 'path';
import { normalizeQuestion } from '@/lib/textNormalization';

// Removed GraphQL fetching. API now serves only local quiz content.

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

export async function GET(request: Request, context: { params: Promise<{ moduleSlug: string }> }) {
  try {
    const { moduleSlug } = await context.params;
    console.log('=== Quiz API Route ===');
    console.log('Received request for quiz module:', moduleSlug);
    
    // No special handling needed. All modules load from local quiz files.

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

    const normalizedQuestions = Array.isArray(quiz.questions) ? quiz.questions.map((q: any) => normalizeQuestion(q)) : [];
    const normalizedQuiz = { ...quiz, questions: normalizedQuestions };

    return new Response(JSON.stringify(normalizedQuiz), {
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