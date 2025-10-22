import { normalizeQuestion } from '@/lib/textNormalization';
import { getApiBaseStrict } from '@/lib/urlUtils';
import { contentRegistry } from '@/lib/contentRegistry';

// Database-based quiz loading function
async function fetchQuizFromDatabase(moduleSlug: string) {
  try {
    // Use the correct endpoint to fetch quizzes for a module by slug
    const apiBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8080'; } })();
    const quizResponse = await fetch(`${apiBase}/api/modules/${moduleSlug}/quiz`, { cache: 'no-store' });
    if (!quizResponse.ok) {
      console.error(`Failed to fetch quizzes for module ${moduleSlug}`);
      return { questions: [] };
    }
    
    const quizzes = await quizResponse.json();
    console.log(`Successfully loaded ${quizzes.length} quiz questions from database for module: ${moduleSlug}`);
    
    // Transform the database quizzes to match the expected frontend format
    const questions = quizzes.map((quiz: {
      id: number;
      question: string;
      choices?: string;
      correctAnswer: number;
      explanation?: string;
      topic?: string;
      questionType?: string;
      difficulty?: string;
      estimatedTime?: number;
    }) => ({
      id: quiz.id,
      question: quiz.question,
      choices: quiz.choices ? JSON.parse(quiz.choices) : [],
      correctAnswer: quiz.correctAnswer,
      explanation: quiz.explanation,
      topic: quiz.topic || 'general',
      type: quiz.questionType || 'multiple-choice',
      difficulty: quiz.difficulty || 'Beginner',
      estimatedTime: quiz.estimatedTime || 90
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
    
    // Convert shortSlug to moduleSlug if needed using the central registry
    const moduleSlug = (await contentRegistry.getModuleSlugFromShortSlug(inputSlug)) || inputSlug;
    console.log('Resolved to module slug:', moduleSlug);
    
    const quiz = await fetchQuizFromDatabase(moduleSlug);
    
    // If no questions from database, try fallback
    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      const fallbackQuiz = await fetchQuizFallbackFromJson(request, moduleSlug);
      if (Array.isArray(fallbackQuiz.questions) && fallbackQuiz.questions.length > 0) {
        return new Response(JSON.stringify(fallbackQuiz), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400',
          },
        });
      }
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