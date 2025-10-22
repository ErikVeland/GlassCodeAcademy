import { normalizeQuestion } from '@/lib/textNormalization';
import { getApiBaseStrict, getPublicOriginStrict } from '@/lib/urlUtils';
import { contentRegistry } from '@/lib/contentRegistry';

// Database-based quiz loading function
async function fetchQuizFromDatabase(moduleSlug: string) {
  try {
    // Try multiple API base candidates in case of misconfiguration
    const primaryBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8080'; } })();
    const bases = Array.from(new Set([primaryBase, 'http://127.0.0.1:8080']));

    for (const apiBase of bases) {
      try {
        // Use the correct endpoint to fetch quizzes for a module by slug
        const quizResponse = await fetch(`${apiBase}/api/modules/${moduleSlug}/quiz`, { cache: 'no-store' });
        if (!quizResponse.ok) {
          console.error(`[quizzes] Failed to fetch quizzes for module ${moduleSlug} from ${apiBase}`);
          continue;
        }
        
        const quizzes = await quizResponse.json();
        console.log(`[quizzes] Successfully loaded ${quizzes.length} quiz questions from ${apiBase} for module: ${moduleSlug}`);
        
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
      } catch (innerErr) {
        console.error(`[quizzes] Error using ${apiBase}:`, innerErr);
        continue;
      }
    }
    
    // If nothing worked, return empty array
    return { questions: [] };
  } catch (error) {
    console.error('Error fetching quiz from database:', error);
    return { questions: [] };
  }
}

// Fallback: Load quiz from static JSON in public/content/quizzes
async function fetchQuizFallbackFromJson(request: Request, moduleSlug: string) {
  try {
    // Server-side: Node fetch requires absolute URLs. Try local origins proactively in dev.
    const candidates: string[] = [];
    try {
      const origin = getPublicOriginStrict().replace(/\/\/+$/, '');
      candidates.push(`${origin}/content/quizzes/${moduleSlug}.json`);
    } catch {
      // no configured public origin; rely on localhost candidates
    }
    // Common localhost dev ports
    candidates.push(
      'http://localhost:3000/content/quizzes/' + moduleSlug + '.json',
      'http://127.0.0.1:3000/content/quizzes/' + moduleSlug + '.json'
    );

    for (const url of candidates) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) continue;
        const data = await res.json();
        const questions = Array.isArray(data?.questions) ? data.questions : Array.isArray(data) ? data : [];
        return { questions };
      } catch {
        // try next candidate
        continue;
      }
    }

    console.warn(`Quiz fallback JSON not found for module: ${moduleSlug}`);
    return { questions: [] };
  } catch (err) {
    console.error('Error fetching quiz from fallback JSON:', err);
    return { questions: [] };
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ moduleSlug: string }> }) {
  try {
    const { moduleSlug: inputSlug } = await params;
    console.log('=== Quiz API Route ===');
    console.log('Received request for quiz input slug:', inputSlug);
    
    // Convert shortSlug to moduleSlug if needed using the central registry
    const moduleSlug = (await contentRegistry.getModuleSlugFromShortSlug(inputSlug)) || inputSlug;
    console.log('Resolved to module slug:', moduleSlug);
    
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