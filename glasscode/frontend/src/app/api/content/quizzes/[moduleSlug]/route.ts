// Use the Web Request type to satisfy Next.js route handler typing
import { normalizeQuestion } from '@/lib/textNormalization';
import { getApiBaseStrict } from '@/lib/urlUtils';

// Removed GraphQL fetching. API now serves only local quiz content.

// Mapping from shortSlug to moduleSlug
const SHORT_SLUG_TO_MODULE_SLUG: Record<string, string> = {
  'programming': 'programming-fundamentals',
  'web': 'web-fundamentals',
  'version': 'version-control',
  'dotnet': 'dotnet-fundamentals',
  'react': 'react-fundamentals',
  'database': 'database-systems',
  'typescript': 'typescript-fundamentals',
  'node': 'node-fundamentals',
  'laravel': 'laravel-fundamentals',
  'nextjs': 'nextjs-advanced',
  'graphql': 'graphql-advanced',
  'sass': 'sass-advanced',
  'tailwind': 'tailwind-advanced',
  'vue': 'vue-advanced',
  'testing': 'testing-fundamentals',
  'performance': 'performance-optimization',
  'security': 'security-fundamentals',
  'e2e': 'e2e-testing'
};

// Database-based quiz loading function
async function fetchQuizFromDatabase(moduleSlug: string) {
  try {
    // Use the correct endpoint to fetch quizzes for a module by slug
    const apiBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8080'; } })();
    const quizzesResponse = await fetch(`${apiBase}/api/modules/${moduleSlug}/quiz`);
    if (!quizzesResponse.ok) {
      console.error(`Failed to fetch quizzes for module ${moduleSlug}`);
      return { questions: [] };
    }
    
    const quizzes = await quizzesResponse.json();
    console.log(`Successfully loaded ${quizzes.length} quiz questions from database for module: ${moduleSlug}`);
    
    // Transform the database quizzes to match the expected frontend format
    const questions = quizzes.map((quiz: {
      id: number;
      question: string;
      choices?: string;
      correctAnswer: number;
      explanation?: string;
      topic?: string;
      type?: string;
    }) => ({
      id: quiz.id,
      question: quiz.question,
      choices: quiz.choices ? JSON.parse(quiz.choices) : [],
      correctAnswer: quiz.correctAnswer,
      explanation: quiz.explanation,
      topic: quiz.topic || 'general',
      type: quiz.type || 'multiple-choice'
    }));
    
    return { questions };
  } catch (error) {
    console.error('Error fetching quiz from database:', error);
    return { questions: [] };
  }
}

// Fallback: Load quiz from static JSON in public/content/quizzes
async function fetchQuizFallbackFromJson(request: Request, moduleSlug: string) {
  try {
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;
    const res = await fetch(`${origin}/content/quizzes/${moduleSlug}.json`, { cache: 'no-store' });
    if (!res.ok) {
      console.warn(`Quiz fallback JSON not found for module: ${moduleSlug}`);
      return { questions: [] };
    }
    const data = await res.json();
    const questions = Array.isArray(data?.questions) ? data.questions : Array.isArray(data) ? data : [];
    return { questions };
  } catch (err) {
    console.error('Error fetching quiz from fallback JSON:', err);
    return { questions: [] };
  }
}

export async function GET(request: Request, context: { params: Promise<{ moduleSlug: string }> }) {
  try {
    const { moduleSlug: inputSlug } = await context.params;
    console.log('=== Quiz API Route ===');
    console.log('Received request for quiz input slug:', inputSlug);
    
    // Convert shortSlug to moduleSlug if needed
    const moduleSlug = SHORT_SLUG_TO_MODULE_SLUG[inputSlug] || inputSlug;
    console.log('Resolved to module slug:', moduleSlug);
    
    // Try database first
    let quiz = await fetchQuizFromDatabase(moduleSlug);

    // If database returned no questions, fall back to static JSON
    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      console.log(`No DB quizzes for ${moduleSlug}. Falling back to JSON.`);
      quiz = await fetchQuizFallbackFromJson(request, moduleSlug);
    }
    
    const normalizedQuestions = Array.isArray(quiz.questions)
      ? (quiz.questions as unknown[]).map((q) => normalizeQuestion(q))
      : [];
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