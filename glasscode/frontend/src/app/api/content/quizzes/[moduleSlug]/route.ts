import { normalizeQuestion } from '@/lib/textNormalization';
import { getApiBaseStrict } from '@/lib/urlUtils';
import { contentRegistry } from '@/lib/contentRegistry';
import { debugLog } from '@/lib/httpUtils';


// Database-based quiz loading function
async function fetchQuizFromDatabase(moduleSlug: string) {
  // Build candidate backend bases robustly, even if env is misconfigured
  const bases: string[] = [];
  try {
    bases.push(getApiBaseStrict());
  } catch {
    // ignore missing env; will rely on localhost fallback
  }
  // Always include localhost dev fallback
  bases.push('http://127.0.0.1:8080');

  for (const apiBase of bases) {
    try {
      // Use the correct endpoint to fetch quizzes for a module by slug
      const quizResponse = await fetch(`${apiBase}/api/modules/${moduleSlug}/quiz`, { cache: 'no-store' });
      if (!quizResponse.ok) {
        console.error(`[quizzes] Failed to fetch quizzes for module ${moduleSlug} from ${apiBase}`);
        continue;
      }

      const result = await quizResponse.json();
      const quizzes = Array.isArray(result.data) ? result.data : [];
      debugLog(`[quizzes] Loaded ${quizzes.length} quiz questions from ${apiBase} for module: ${moduleSlug}`);

      // Transform the database quizzes to match the expected frontend format
      const questions = quizzes.map((quiz: {
        id: number;
        question: string;
        choices?: unknown;
        correctAnswer: number;
        explanation?: string;
        topic?: string;
        questionType?: string;
        difficulty?: string;
        estimatedTime?: number;
        sort_order?: number;
      }) => {
        let choices: string[] = [];
        if (Array.isArray(quiz.choices)) {
          choices = quiz.choices as string[];
        } else if (typeof quiz.choices === 'string') {
          const str = quiz.choices as string;
          try {
            const parsed = JSON.parse(str);
            choices = Array.isArray(parsed) ? parsed : [];
          } catch {
            const split = str.split(/\r?\n|\||;/).map(s => s.trim()).filter(Boolean);
            choices = split.length > 0 ? split : (str.trim() ? [str.trim()] : []);
          }
        }

        return {
          id: quiz.id,
          question: quiz.question,
          choices,
          correctAnswer: quiz.correctAnswer,
          explanation: quiz.explanation,
          topic: quiz.topic || 'general',
          type: quiz.questionType || 'multiple-choice',
          difficulty: (quiz.difficulty as string) || 'Beginner',
          estimatedTime: quiz.estimatedTime || 90,
          order: quiz.sort_order || 0
        };
      });

      if (questions.length > 0) {
        return { questions };
      }

      debugLog(`[quizzes] ${apiBase} returned 0 questions for ${moduleSlug}; will try next source or file fallback.`);
      continue;
    } catch (innerErr) {
      console.error(`[quizzes] Error using ${apiBase}:`, innerErr);
      continue;
    }
  }

  // Backend-only: if fetches failed or returned nothing, return empty
  return { questions: [] };
}

// Removed file-based quiz fallback implementation

export async function GET(request: Request, { params }: { params: { moduleSlug: string } }) {
  try {
    const { moduleSlug: inputSlug } = params || { moduleSlug: '' } as { moduleSlug: string };
    debugLog('=== Quiz API Route ===');
    debugLog('Received request for quiz input slug:', inputSlug);
    
    // Convert shortSlug to moduleSlug if needed using the central registry
    const moduleSlugResolved = await contentRegistry.getModuleSlugFromShortSlug(inputSlug);
    if (!moduleSlugResolved) {
      debugLog(`[quizzes] Unknown or unsupported module slug: ${inputSlug}`);
      return new Response(JSON.stringify({ error: 'Module not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const moduleSlug = moduleSlugResolved;
    debugLog('Resolved to module slug:', moduleSlug);
    
    const quiz = await fetchQuizFromDatabase(moduleSlug);
    
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
    // Return error without falling back to file content
    return new Response(JSON.stringify({ error: 'Failed to load quiz from backend', questions: [] }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// Add explicit export to ensure route is handled
export const runtime = 'nodejs';
export const revalidate = 60; // cache responses for 60 seconds to reduce backend load
export const dynamic = 'force-static';