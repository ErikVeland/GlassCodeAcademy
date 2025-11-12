"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Module } from "@/lib/contentRegistry";
import QuizLayout from "@/components/QuizLayout";
import LoadingScreen from "@/components/LoadingScreen";

// Client-safe types for registry and quizzes
interface RegistryModule {
  slug: string;
  shortSlug?: string;
  title: string;
  description?: string;
  icon?: string;
  technologies?: string[];
  difficulty?: string;
  tier?: string;
  thresholds?: {
    requiredLessons?: number;
    requiredQuestions?: number;
    passingScore?: number;
  };
  metadata?: {
    thresholds?: {
      minLessons?: number;
      minQuizQuestions?: number;
      passingScore?: number;
    };
  };
  routes: {
    overview: string;
    lessons: string;
    quiz: string;
    results?: string;
  };
  prerequisites?: string[];
}

interface RegistryResponse {
  modules: RegistryModule[];
}

interface ProgrammingQuestion {
  id: string | number;
  question: string;
  choices?: string[];
  correctAnswer?: number | string;
  explanation?: string;
  topic?: string;
  type?: string;
  difficulty?: string;
  estimatedTime?: number;
  order?: number;
  fixedChoiceOrder?: boolean;
}

interface QuizResponse {
  questions: ProgrammingQuestion[];
}

// Helper to fetch JSON with simple error handling
async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Request failed: ${res.status} ${res.statusText} - ${text}`,
    );
  }
  return res.json() as Promise<T>;
}

function findModuleByShortSlug(
  mods: RegistryModule[] | undefined,
  shortSlug: string,
): RegistryModule | undefined {
  const list = Array.isArray(mods) ? mods : [];
  return (
    list.find((m) => m.routes?.overview === `/${shortSlug}`) ||
    list.find((m) => m.routes?.quiz?.startsWith(`/${shortSlug}/quiz`)) ||
    list.find((m) => m.shortSlug === shortSlug) ||
    list.find((m) => m.slug === shortSlug)
  );
}

function computeThresholds(
  mod: RegistryModule,
  lessonsCount: number,
  quizCount: number,
) {
  const requiredLessons =
    mod.thresholds?.requiredLessons ??
    mod.metadata?.thresholds?.minLessons ??
    1;
  const requiredQuestions =
    mod.metadata?.thresholds?.minQuizQuestions ??
    mod.thresholds?.requiredQuestions ??
    14;
  const passingScore =
    mod.metadata?.thresholds?.passingScore ??
    mod.thresholds?.passingScore ??
    70;
  return {
    quizValid: quizCount >= requiredQuestions,
    lessonsValid: lessonsCount >= requiredLessons,
    lessons: lessonsCount >= requiredLessons,
    quiz: quizCount >= requiredQuestions,
    passingScore,
    requiredQuestions,
  };
}

interface QuizData {
  title: string;
  totalQuestions: number;
  timeLimit: number;
  passingScore: number;
  instructions: string[];
  _sessionSeed?: {
    selectedQuestions: ProgrammingQuestion[];
  };
}

interface QuizSession {
  questions: ProgrammingQuestion[];
  totalQuestions: number;
  passingScore: number;
  timeLimit: number;
  startedAt: number;
  answers: (string | null)[];
}

export default function QuizPage({
  params,
}: {
  params: Promise<{ shortSlug: string }>;
}) {
  const router = useRouter();
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [quiz, setQuiz] = useState<{ questions: ProgrammingQuestion[] } | null>(
    null,
  );
  const [thresholds, setThresholds] = useState<{
    quizValid: boolean;
    lessonsValid: boolean;
    lessons?: boolean;
    quiz?: boolean;
  } | null>(null);
  const [unlockingModules, setUnlockingModules] = useState<
    {
      slug: string;
      title: string;
      routes: { overview: string };
    }[]
  >([]);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poolCount, setPoolCount] = useState(0);
  const [reqPercent, setReqPercent] = useState(0);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [prefetchStatus, setPrefetchStatus] = useState<{
    isPrefetching: boolean;
    prefetchedCount: number;
    queueLength: number;
  } | null>(null);
  const prefetchCheckInterval = useRef<NodeJS.Timeout | null>(null);

  const initializeQuizData = useCallback(
    async (
      moduleData: typeof currentModule,
      moduleQuiz: typeof quiz,
      moduleThresholds: typeof thresholds,
    ) => {
      console.log("=== initializeQuizData Debug ===");
      console.log("moduleData:", moduleData);
      console.log("moduleQuiz:", moduleQuiz);
      console.log("moduleQuiz?.questions:", moduleQuiz?.questions);
      console.log(
        "moduleQuiz?.questions?.length:",
        moduleQuiz?.questions?.length,
      );

      // Add null checks at the beginning
      if (!moduleData) {
        console.log("Early return: No module data");
        return;
      }

      if (!moduleQuiz?.questions || moduleQuiz.questions.length === 0) {
        console.log("Early return: No quiz questions available");
        return;
      }

      try {
        const targetQuestions =
          moduleData.metadata?.thresholds?.minQuizQuestions ??
          moduleData.thresholds?.requiredQuestions ??
          15;
        const allQuestions = moduleQuiz.questions;
        setPoolCount(allQuestions.length);
        console.log("Pool count set to:", allQuestions.length);

        // Get history from localStorage to avoid recently used questions
        const historyKey = `quiz_history_${moduleData.slug}`;
        const historyData = localStorage.getItem(historyKey);
        const recentQuestionIds = historyData ? JSON.parse(historyData) : [];

        // Filter out recently used questions
        const availableQuestions = allQuestions.filter(
          (q: ProgrammingQuestion) => !recentQuestionIds.includes(q.id),
        );
        const questionsToUse =
          availableQuestions.length >= targetQuestions
            ? availableQuestions
            : allQuestions;

        // Shuffle and select questions
        const shuffled = [...questionsToUse].sort(() => Math.random() - 0.5);
        const effectiveTarget = Math.min(targetQuestions, shuffled.length);
        const selectedQuestions = shuffled.slice(0, effectiveTarget);
        console.log("Selected questions count:", selectedQuestions.length);

        // Randomize choice order for multiple choice questions AND preserve correctAnswer index
        const processedQuestions = selectedQuestions.map(
          (question: ProgrammingQuestion) => {
            if (
              question.type === "multiple-choice" &&
              question.choices &&
              !question.fixedChoiceOrder
            ) {
              const originalChoices = question.choices;
              const originalCorrectIndex =
                typeof question.correctAnswer === "number"
                  ? question.correctAnswer
                  : -1;
              const originalCorrectChoice =
                originalCorrectIndex >= 0 &&
                originalCorrectIndex < originalChoices.length
                  ? originalChoices[originalCorrectIndex]
                  : undefined;
              const shuffledChoices = [...originalChoices].sort(
                () => Math.random() - 0.5,
              );
              let newCorrectIndex = originalCorrectIndex;
              if (originalCorrectChoice !== undefined) {
                const idx = shuffledChoices.findIndex(
                  (c) => c === originalCorrectChoice,
                );
                newCorrectIndex = idx >= 0 ? idx : 0; // fallback to 0 if not found
              }
              return {
                ...question,
                choices: shuffledChoices,
                correctAnswer: newCorrectIndex,
              };
            }
            return question;
          },
        );
        if (debugEnabled) {
          console.log(
            "Selected IDs:",
            processedQuestions.map((q: ProgrammingQuestion) => q.id),
          );
        }

        // Calculate time limit and passing score
        const timeLimit = Math.min(
          Math.max(
            Math.ceil(
              Math.min(targetQuestions, selectedQuestions.length) * 1.5,
            ),
            10,
          ),
          45,
        );
        const passingScore =
          moduleData.metadata?.thresholds?.passingScore || 70;

        // Calculate requirement percentage
        const reqPercentage =
          (moduleThresholds?.lessons ? 50 : 0) +
            (moduleThresholds?.quiz ? 50 : 0) || 0;
        setReqPercent(reqPercentage);

        const quizOverview: QuizData = {
          title: `${moduleData.title} Assessment`,
          totalQuestions: Math.min(targetQuestions, selectedQuestions.length),
          timeLimit,
          passingScore,
          instructions: [
            `You will answer ${Math.min(targetQuestions, selectedQuestions.length)} questions covering key concepts from the ${moduleData.title} module.`,
            "Questions are randomly selected from a larger pool to keep each attempt fresh.",
            "Read each question carefully before selecting your answer.",
            "You can review and change your answers before submitting.",
            `You need ${passingScore}% or higher to pass this assessment.`,
            "The timer will start as soon as you begin the quiz.",
            "Make sure you have a stable internet connection before starting.",
          ],
          _sessionSeed: { selectedQuestions: processedQuestions },
        };

        console.log("Setting quizData:", quizOverview);
        setQuizData(quizOverview);

        // Store session seed for debugging
        if (debugEnabled) {
          sessionStorage.setItem(
            "_sessionSeed",
            JSON.stringify({
              selectedQuestions: processedQuestions,
              timestamp: Date.now(),
            }),
          );
        }
      } catch (err) {
        console.error("Error preparing quiz data:", err);
        setError("Failed to prepare quiz");
      }
    },
    [debugEnabled],
  );

  // Check for prefetched quiz data
  const checkPrefetchedQuiz = useCallback(async (moduleSlug: string) => {
    try {
      // Check if quiz is prefetched in localStorage
      const cacheKey = `quiz_prefetch_${moduleSlug}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const { timestamp } = JSON.parse(cached);
        // Use cache if less than 30 minutes old
        if (Date.now() - timestamp < 30 * 60 * 1000) {
          console.log(`[QuizPage] Using prefetched quiz for ${moduleSlug}`);
          return true;
        }
      }

      // Check if quiz is prefetched in sessionStorage
      const sessionCacheKey = `prefetch_quiz_${moduleSlug}`;
      const sessionCached = sessionStorage.getItem(sessionCacheKey);

      if (sessionCached) {
        const { timestamp } = JSON.parse(sessionCached);
        // Use cache if less than 5 minutes old
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          console.log(
            `[QuizPage] Using session prefetched quiz for ${moduleSlug}`,
          );
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error(
        `[QuizPage] Error checking prefetched quiz for ${moduleSlug}:`,
        error,
      );
      return false;
    }
  }, []);

  useEffect(() => {
    async function initializePage() {
      try {
        const resolvedParams = await params;
        const slug = resolvedParams.shortSlug;
        console.log("=== Quiz Page Debug ===");
        console.log("Short slug:", slug);
        // Fetch registry and locate the module by shortSlug
        const registry = await fetchJSON<RegistryResponse>(
          "/api/content/registry",
        );
        const mods = Array.isArray(registry?.modules) ? registry.modules : [];
        const moduleDataRaw = findModuleByShortSlug(mods, slug);
        console.log("Module data:", moduleDataRaw);
        if (!moduleDataRaw) {
          setError("Module not found");
          return;
        }
        // Cast to Module for layout compatibility
        const moduleData = moduleDataRaw as unknown as Module;
        setCurrentModule(moduleData);

        // Check if quiz is prefetched before loading
        const isPrefetched = await checkPrefetchedQuiz(moduleDataRaw.slug);
        console.log(
          `Quiz for ${moduleDataRaw.slug} is ${isPrefetched ? "prefetched" : "not prefetched"}`,
        );

        // Fetch quiz questions
        const moduleQuiz = await fetchJSON<QuizResponse>(
          `/api/content/quizzes/${moduleDataRaw.slug}`,
        );
        console.log("Module quiz:", moduleQuiz);
        setQuiz(moduleQuiz);

        // Fetch lessons to compute thresholds (robust to array or { lessons: [] } and HTTP failures)
        let lessonsCount = 0;
        try {
          const lessonsResp = await fetch(
            `/api/content/lessons/${moduleDataRaw.slug}`,
            { cache: "no-store" },
          );
          if (lessonsResp.ok) {
            const data = await lessonsResp.json();
            lessonsCount = Array.isArray(data)
              ? data.length
              : Array.isArray((data as { lessons?: unknown[] })?.lessons)
                ? (data as { lessons?: unknown[] }).lessons?.length || 0
                : 0;
          } else {
            const text = await lessonsResp.text().catch(() => "");
            console.warn(
              `Lessons fetch failed: ${lessonsResp.status} ${lessonsResp.statusText} - ${text}`,
            );
          }
        } catch (e) {
          console.warn("Lessons fetch error:", e);
        }
        const quizCount = Array.isArray(moduleQuiz?.questions)
          ? moduleQuiz.questions.length
          : 0;
        const computedThresholds = computeThresholds(
          moduleDataRaw,
          lessonsCount,
          quizCount,
        );
        console.log("Module thresholds:", computedThresholds);
        setThresholds({
          quizValid: computedThresholds.quizValid,
          lessonsValid: computedThresholds.lessonsValid,
          lessons: computedThresholds.lessons,
          quiz: computedThresholds.quiz,
        });

        // In production, only block when there are zero questions.
        // Allow quizzes to load even if below minimum thresholds.
        const totalQuestions = Array.isArray(moduleQuiz?.questions)
          ? moduleQuiz.questions.length
          : 0;
        if (totalQuestions === 0 && process.env.NODE_ENV === "production") {
          setError("Quiz not available");
          return;
        }

        // Compute unlocking modules from registry
        const unlocking = registry.modules
          .filter((m) => (m.prerequisites || []).includes(moduleDataRaw.slug))
          .map((m) => ({
            slug: m.slug,
            title: m.title,
            routes: { overview: m.routes.overview },
          }));
        setUnlockingModules(unlocking);

        // Initialize quiz data
        await initializeQuizData(moduleData, moduleQuiz, {
          quizValid: computedThresholds.quizValid,
          lessonsValid: computedThresholds.lessonsValid,
          lessons: computedThresholds.lessons,
          quiz: computedThresholds.quiz,
        });
      } catch (err) {
        console.error("Error initializing quiz page:", err);
        setError("Failed to load quiz data");
      } finally {
        setLoading(false);
      }
    }

    initializePage();
  }, [params, initializeQuizData, checkPrefetchedQuiz]);

  // Check prefetch status periodically
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Import the quizPrefetchService dynamically
      import("@/lib/quizPrefetchService").then(({ quizPrefetchService }) => {
        // Check status immediately
        setPrefetchStatus(quizPrefetchService.getPrefetchStatus());

        // Clear any existing interval
        if (prefetchCheckInterval.current) {
          clearInterval(prefetchCheckInterval.current);
        }

        // Check status every 2 seconds
        prefetchCheckInterval.current = setInterval(() => {
          setPrefetchStatus(quizPrefetchService.getPrefetchStatus());
        }, 2000);
      });
    }

    return () => {
      if (prefetchCheckInterval.current) {
        clearInterval(prefetchCheckInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    setDebugEnabled(localStorage.getItem("debug") === "true");
  }, []);

  const handleStartQuiz = async () => {
    if (
      !currentModule ||
      !quiz ||
      !Array.isArray(quiz.questions) ||
      quiz.questions.length === 0
    ) {
      console.error("Quiz not ready");
      return;
    }

    try {
      // Use precomputed seed if available; otherwise derive a selection now
      let selectedQuestions: ProgrammingQuestion[] = (quizData?._sessionSeed
        ?.selectedQuestions ?? []) as ProgrammingQuestion[];
      if (!selectedQuestions.length) {
        const shuffledPool = [...quiz.questions].sort(
          () => Math.random() - 0.5,
        );
        const target = Math.min(quizLength, shuffledPool.length);
        const pick = shuffledPool.slice(0, target);
        selectedQuestions = pick.map((q) => {
          const originalChoices = (q.choices || []).map((c) => String(c));
          // Determine the correct choice from either index or text
          let originalCorrectIndex = -1;
          if (typeof q.correctAnswer === "number") {
            originalCorrectIndex = q.correctAnswer;
          } else if (typeof q.correctAnswer === "string") {
            const correctText = String(q.correctAnswer);
            originalCorrectIndex = originalChoices.findIndex(
              (c) => c === correctText,
            );
          }
          const originalCorrectChoice =
            originalCorrectIndex >= 0 &&
            originalCorrectIndex < originalChoices.length
              ? originalChoices[originalCorrectIndex]
              : undefined;
          const shuffledChoices = [...originalChoices].sort(
            () => Math.random() - 0.5,
          );
          let newCorrectIndex = 0;
          if (originalCorrectChoice !== undefined) {
            const idx = shuffledChoices.findIndex(
              (c) => c === originalCorrectChoice,
            );
            newCorrectIndex = idx >= 0 ? idx : 0;
          }
          return {
            ...q,
            choices: shuffledChoices,
            correctAnswer: newCorrectIndex,
          } as ProgrammingQuestion;
        });
      }

      const sessionPayload: QuizSession = {
        questions: selectedQuestions,
        totalQuestions: selectedQuestions.length,
        passingScore: quizData?.passingScore ?? passingScore,
        timeLimit:
          quizData?.timeLimit ??
          Math.min(Math.max(Math.ceil(selectedQuestions.length * 1.5), 10), 45),
        startedAt: Date.now(),
        answers: new Array(selectedQuestions.length).fill(null),
      };

      // Store session in sessionStorage
      const sessionKey = `quizSession:${currentModule.slug}`;
      sessionStorage.setItem(sessionKey, JSON.stringify(sessionPayload));

      // Update localStorage history
      const historyKey = `quiz_history_${currentModule.slug}`;
      const historyData = localStorage.getItem(historyKey);
      const currentHistory = historyData ? JSON.parse(historyData) : [];
      const newQuestionIds = selectedQuestions.map(
        (q: ProgrammingQuestion) => q.id,
      );
      const updatedHistory = [...newQuestionIds, ...currentHistory].slice(
        0,
        200,
      );
      localStorage.setItem(historyKey, JSON.stringify(updatedHistory));

      // Navigate to first question (our questions are 1-indexed in routes)
      router.push(`/${currentModule.slug}/quiz/question/1`);
    } catch (err) {
      console.error("Error starting quiz:", err);
      setError("Failed to start quiz");
    }
  };

  if (loading) {
    return (
      <LoadingScreen
        message="Loading quiz..."
        prefetchStatus={prefetchStatus}
      />
    );
  }

  if (error || !currentModule) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold text-fg mb-4">
            {error || "Module not found"}
          </h2>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-fg rounded-lg hover:opacity-90 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const passingScore = currentModule.metadata?.thresholds?.passingScore || 70;
  const layoutThresholds = {
    requiredQuestions: currentModule.thresholds?.requiredQuestions,
    passingScore,
  } as {
    requiredQuestions?: number;
    passingScore: number;
  };
  const quizLength =
    currentModule.metadata?.thresholds?.minQuizQuestions ??
    currentModule.thresholds?.requiredQuestions ??
    15;
  const poolSize = Array.isArray(quiz?.questions) ? quiz.questions.length : 0;
  const derivedTotal =
    quizData?.totalQuestions ?? Math.min(quizLength, poolSize);
  const derivedTimeLimit =
    quizData?.timeLimit ??
    Math.min(Math.max(Math.ceil(derivedTotal * 1.5), 10), 45);
  const derivedPassingScore = quizData?.passingScore ?? passingScore;

  return (
    <QuizLayout
      module={currentModule}
      thresholds={layoutThresholds}
      unlockingModules={unlockingModules}
    >
      {/* Prefetch Status Indicator */}
      {prefetchStatus && prefetchStatus.isPrefetching && (
        <div className="mb-6 glass-morphism p-4 rounded-lg border border-border">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-3"></div>
            <div>
              <p className="text-sm font-medium text-primary">
                Background quiz prefetching in progress
              </p>
              <p className="text-xs text-muted">
                {prefetchStatus.prefetchedCount} quizzes loaded
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Content */}
      {quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0 ? (
        <div className="space-y-8">
          {/* Assessment Overview */}
          <div className="glass-morphism px-8 py-8 rounded-xl">
            <h2 className="text-2xl font-semibold text-fg mb-4">
              🎯 Assessment Overview
            </h2>
            <p className="text-muted mb-6">
              You will answer {derivedTotal} randomly selected questions
              covering key concepts from the {currentModule.title} module.
              Questions are chosen from a larger pool to keep each attempt
              fresh.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Quiz Length combined with pool size */}
              <div className="bg-surface-alt p-4 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {derivedTotal}{" "}
                  <span className="text-sm font-medium text-muted">
                    questions
                  </span>
                </div>
                <div className="text-xs text-muted mt-1">
                  Pool: {poolCount || poolSize}
                </div>
              </div>
              {/* Requirement Met */}
              <div className="bg-surface-alt p-4 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {reqPercent}%
                </div>
                <div className="text-sm text-muted">Requirement Met</div>
              </div>
              {/* Time Limit */}
              <div className="bg-surface-alt p-4 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {derivedTimeLimit} min
                </div>
                <div className="text-sm text-muted">Time Limit</div>
              </div>
              {/* Passing Score */}
              <div className="bg-surface-alt p-4 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {derivedPassingScore}%
                </div>
                <div className="text-sm text-muted">Passing Score</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 bg-surface-alt text-fg rounded-full text-sm">
                Multiple Choice
              </span>
              <span className="px-3 py-1 bg-surface-alt text-fg rounded-full text-sm">
                True/False
              </span>
              <span className="px-3 py-1 bg-surface-alt text-fg rounded-full text-sm">
                Scenario-Based
              </span>
            </div>

            {unlockingModules && unlockingModules.length > 0 && (
              <div className="mb-6 border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-fg mb-3">
                  Unlocks on completion
                </h3>
                <div className="flex flex-wrap gap-2">
                  {unlockingModules.map((m) => (
                    <Link
                      key={m.slug}
                      href={m.routes.overview}
                      className="unlock-chip"
                    >
                      <span className="mr-1">🔓</span>
                      {m.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quiz Instructions */}
          <div className="glass-morphism p-8 rounded-xl">
            <h2 className="text-2xl font-semibold text-fg mb-6">
              📋 Quiz Instructions
            </h2>

            <ul className="space-y-4 mb-8">
              {(
                quizData?.instructions ?? [
                  `You will answer ${derivedTotal} questions covering key concepts from the ${currentModule.title} module.`,
                  "Questions are randomly selected from a larger pool to keep each attempt fresh.",
                  "Read each question carefully before selecting your answer.",
                  "You can review and change your answers before submitting.",
                  `You need ${derivedPassingScore}% or higher to pass this assessment.`,
                  "The timer will start as soon as you begin the quiz.",
                  "Make sure you have a stable internet connection before starting.",
                ]
              ).map((instruction: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-surface-alt text-fg rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-fg">{instruction}</span>
                </li>
              ))}
            </ul>

            <div className="bg-surface-alt border border-border rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-warning text-xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-warning">
                    Important
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    Once you start the quiz, the timer will begin and cannot be
                    paused. Make sure you&apos;re ready before clicking Start
                    Quiz.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleStartQuiz}
                className="inline-flex items-center px-8 py-4 bg-primary text-primary-fg rounded-lg hover:opacity-90 transition-colors text-lg font-medium"
              >
                Start Quiz
                <span className="ml-2">🎯</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-morphism p-12 rounded-xl text-center">
          <div className="text-6xl mb-4">❓</div>
          <h2 className="text-2xl font-semibold text-fg mb-4">
            Quiz Questions Not Available Yet
          </h2>
          <p className="text-muted mb-6">
            Quiz questions for this module are currently being prepared. Check
            back soon!
          </p>
          <Link
            href={currentModule.routes.overview}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-fg rounded-lg hover:opacity-90 transition-colors"
          >
            ← Back to Module
          </Link>
        </div>
      )}

      {/* Navigation Footer */}
      <footer className="mt-12 flex justify-between items-center">
        <Link
          href={currentModule.routes.overview}
          className="inline-flex items-center px-4 py-2 text-muted hover:text-fg transition-colors"
        >
          ← Back to Module Overview
        </Link>

        {thresholds?.lessonsValid && (
          <Link
            href={currentModule.routes.lessons}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-fg rounded-lg hover:opacity-90 transition-colors"
          >
            Review Lessons
            <span className="ml-2">📚</span>
          </Link>
        )}
      </footer>
    </QuizLayout>
  );
}
