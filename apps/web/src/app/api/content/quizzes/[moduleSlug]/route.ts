import { normalizeQuestion } from "@/lib/textNormalization";
import { getApiBaseStrict } from "@/lib/urlUtils";
import { contentRegistry } from "@/lib/contentRegistry";
import { debugLog } from "@/lib/httpUtils";

// Strict types for quiz payloads
interface QuizQuestion {
  id: number | string;
  question: string;
  choices: string[];
  correctAnswer: number | string;
  explanation?: string;
  topic: string;
  type: string;
  difficulty: string;
  estimatedTime: number;
  order: number;
}

interface QuizPayload {
  questions: QuizQuestion[];
}


// Database-based quiz loading function
async function fetchQuizFromDatabase(moduleSlug: string): Promise<QuizPayload> {
  // Build candidate backend bases robustly, even if env is misconfigured
  const bases: string[] = [];
  try {
    bases.push(getApiBaseStrict());
  } catch {
    // ignore missing env; will rely on localhost fallback
  }
  // Always include localhost dev fallback
  // Try new Fastify API first, then legacy
  bases.push('http://127.0.0.1:8081');
  // Removed legacy Express fallback on :8080; Fastify runs on :8081

  for (const apiBase of bases) {
    try {
      // Use the correct endpoint to fetch quizzes for a module by slug
      const quizResponse = await fetch(
        `${apiBase}/api/modules/${moduleSlug}/quiz`,
        { cache: "no-store" },
      );
      if (!quizResponse.ok) {
        console.error(
          `[quizzes] Failed to fetch quizzes for module ${moduleSlug} from ${apiBase}`,
        );
        continue;
      }

      const result: unknown = await quizResponse.json();
      const candidate: unknown[] = Array.isArray((result as { data?: unknown[] }).data)
        ? ((result as { data: unknown[] }).data)
        : Array.isArray((result as { questions?: unknown[] }).questions)
        ? ((result as { questions: unknown[] }).questions)
        : Array.isArray(result)
        ? (result as unknown[])
        : [];

      debugLog(`[quizzes] Loaded ${candidate.length} quiz questions from ${apiBase} for module: ${moduleSlug}`);

      // Transform database items into strict QuizQuestion objects
      const questions: QuizQuestion[] = candidate.map((quizUnknown): QuizQuestion => {
        const quiz = quizUnknown as Record<string, unknown>;

        // Normalize choices
        let choices: string[] = [];
        const rawChoices = quiz['choices'];
        if (Array.isArray(rawChoices)) {
          choices = (rawChoices as unknown[]).filter((c): c is string => typeof c === 'string');
        } else if (typeof rawChoices === 'string') {
          const str = rawChoices;
          try {
            const parsed = JSON.parse(str);
            if (Array.isArray(parsed)) {
              choices = parsed.filter((c): c is string => typeof c === 'string');
            }
          } catch {
            const split = str.split(/\r?\n|\||;/).map(s => s.trim()).filter(Boolean);
            choices = split.length > 0 ? split : (str.trim() ? [str.trim()] : []);
          }
        }

        const idRaw = quiz['id'];
        const id: number | string = typeof idRaw === 'number' || typeof idRaw === 'string' ? idRaw : 0;

        const questionRaw = quiz['question'];
        const question = typeof questionRaw === 'string' ? questionRaw : '';

        const correctRaw = quiz['correctAnswer'];
        const correctAnswer: number | string = typeof correctRaw === 'number' || typeof correctRaw === 'string' ? correctRaw : 0;

        const explanationRaw = quiz['explanation'];
        const explanation = typeof explanationRaw === 'string' ? explanationRaw : undefined;

        const topicRaw = quiz['topic'];
        const topic = typeof topicRaw === 'string' && topicRaw.trim() ? topicRaw : 'general';

        const typeRaw = (quiz['questionType'] ?? quiz['type']);
        const type = typeof typeRaw === 'string' && typeRaw.trim() ? typeRaw : 'multiple-choice';

        const difficultyRaw = quiz['difficulty'];
        const difficulty = typeof difficultyRaw === 'string' && difficultyRaw.trim() ? difficultyRaw : 'Beginner';

        const estRaw = quiz['estimatedTime'];
        const estimatedTime = typeof estRaw === 'number' ? estRaw : 90;

        const orderRaw = (quiz['sort_order'] ?? quiz['order']);
        const order = typeof orderRaw === 'number' ? orderRaw : 0;

        return { id, question, choices, correctAnswer, explanation, topic, type, difficulty, estimatedTime, order };
      });

      if (questions.length > 0) {
        return { questions };
      }

      debugLog(
        `[quizzes] ${apiBase} returned 0 questions for ${moduleSlug}; will try next source or file fallback.`,
      );
      continue;
    } catch (innerErr) {
      console.error(`[quizzes] Error using ${apiBase}:`, innerErr);
      continue;
    }
  }

  // Backend-only: if fetches failed or returned nothing, return empty
  return { questions: [] };
}


export async function GET(
  request: Request,
  { params }: { params: Promise<{ moduleSlug: string }> },
) {
  try {
    const { moduleSlug: inputSlug } = await params;
    debugLog("=== Quiz API Route ===");
    debugLog("Received request for quiz input slug:", inputSlug);

    // Convert shortSlug to moduleSlug if needed using the central registry
    const moduleSlugResolved =
      await contentRegistry.getModuleSlugFromShortSlug(inputSlug);
    if (!moduleSlugResolved) {
      debugLog(`[quizzes] Unknown or unsupported module slug: ${inputSlug}`);
      return new Response(JSON.stringify({ error: "Module not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const moduleSlug = moduleSlugResolved;
    debugLog('Resolved to module slug:', moduleSlug);
    
    const quiz = await fetchQuizFromDatabase(moduleSlug);

    // If backend returned no questions, attempt file-based fallback for development content
    let effectiveQuiz: QuizPayload = quiz;
    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      try {
        const { promises: fs } = await import('fs');
        const path = await import('path');
        const filePath = path.join(process.cwd(), '../../content/quizzes', `${moduleSlug}.json`);
        const raw = await fs.readFile(filePath, 'utf-8');
        const parsed: unknown = JSON.parse(raw);

        let fileQuestionsUnknown: unknown[] = [];
        if (Array.isArray(parsed)) {
          fileQuestionsUnknown = parsed;
        } else if (Array.isArray((parsed as { questions?: unknown[] }).questions)) {
          fileQuestionsUnknown = ((parsed as { questions: unknown[] }).questions);
        }

        if (fileQuestionsUnknown.length > 0) {
          const normalizedFromFile: QuizQuestion[] = fileQuestionsUnknown.map((q) => normalizeQuestion(q) as QuizQuestion);
          effectiveQuiz = { questions: normalizedFromFile };
          debugLog(`[quizzes] Loaded ${normalizedFromFile.length} fallback questions from file for ${moduleSlug}`);
        }
      } catch {
        // no fallback file found; keep empty
      }
    }

    const normalizedQuestions: QuizQuestion[] = Array.isArray(effectiveQuiz.questions)
      ? effectiveQuiz.questions.map((q) => normalizeQuestion(q) as QuizQuestion)
      : [];
    const normalizedQuiz: QuizPayload = { ...effectiveQuiz, questions: normalizedQuestions };

    return new Response(JSON.stringify(normalizedQuiz), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Failed to load quiz:", error);
    // Return error without falling back to file content
    return new Response(
      JSON.stringify({
        error: "Failed to load quiz from backend",
        questions: [],
      }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

}

export const runtime = "nodejs";
export const revalidate = 60; // cache responses for 60 seconds to reduce backend load
export const dynamic = "force-static";
