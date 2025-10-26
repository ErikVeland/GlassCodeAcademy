import { normalizeQuestion } from '@/lib/textNormalization';
import { getApiBaseStrict } from '@/lib/urlUtils';
import { contentRegistry } from '@/lib/contentRegistry';
import fs from 'node:fs/promises';
import path from 'node:path';

// Database-based quiz loading function
async function fetchQuizFromDatabase(moduleSlug: string) {
  try {
    // Try multiple API base candidates in case of misconfiguration
    const primaryBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8080'; } })();
    const isProd = process.env.NODE_ENV === 'production';
    const prodFallbacks = isProd ? ['https://api.glasscode.academy'] : [];
    const bases = Array.from(new Set([primaryBase, ...prodFallbacks, 'http://127.0.0.1:8080']));

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
        console.log(`[quizzes] Successfully loaded ${quizzes.length} quiz questions from ${apiBase} for module: ${moduleSlug}`);
        
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

        console.warn(`[quizzes] ${apiBase} returned 0 questions for ${moduleSlug}; will try next source or file fallback.`);
        continue;
      } catch (innerErr) {
        console.error(`[quizzes] Error using ${apiBase}:`, innerErr);
        continue;
      }
    }
    
    // If nothing worked, try loading from local file content
    const fileQuiz = await fetchQuizFromFile(moduleSlug);
    return fileQuiz.questions.length ? fileQuiz : { questions: [] };
  } catch (error) {
    console.error('Error fetching quiz from database:', error);
    return { questions: [] };
  }
}

async function fetchQuizFromFile(moduleSlug: string): Promise<{ questions: unknown[] }> {
  try {
    const filePath = path.join(process.cwd(), '..', '..', 'content', 'quizzes', `${moduleSlug}.json`);
    const raw = await fs.readFile(filePath, 'utf-8');
    const json = JSON.parse(raw);
    const questions = Array.isArray(json.questions) ? (json.questions as unknown[]) : [];
    console.log(`[quizzes] Loaded ${questions.length} questions from file for ${moduleSlug}`);
    return { questions };
  } catch (err) {
    console.error(`[quizzes] File fallback failed for ${moduleSlug}:`, err);
    return { questions: [] };
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ moduleSlug: string }> }) {
  try {
    const { moduleSlug: inputSlug } = await params;
    console.log('=== Quiz API Route ===');
    console.log('Received request for quiz input slug:', inputSlug);
    
    // Convert shortSlug to moduleSlug if needed using the central registry
    const moduleSlugResolved = await contentRegistry.getModuleSlugFromShortSlug(inputSlug);
    if (!moduleSlugResolved) {
      console.warn(`[quizzes] Unknown or unsupported module slug: ${inputSlug}`);
      return new Response(JSON.stringify({ error: 'Module not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const moduleSlug = moduleSlugResolved;
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