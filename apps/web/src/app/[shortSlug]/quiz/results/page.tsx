"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfettiBurst from "@/components/ConfettiBurst";
import { useProgressTrackingComplete } from "@/hooks/useProgressTrackingComplete";
import { useProgressTracking } from "@/hooks/useProgressTracking";
import { useNextUnlockedLesson } from "@/hooks/useNextUnlockedLesson";
type ProgrammingQuestion = { topic?: string } & Record<string, unknown>;
import QuizResult from "@/components/QuizResult";

type CategoryScore = { category: string; correct: number; total: number };

type ResultsData = {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passingScore: number;
  timeTaken: string;
  timeLimit: string;
  passed: boolean;
  categoryScores: CategoryScore[];
};

// For client components in Next.js 15, params are still Promises that need to be awaited
export default function QuizResultsPage({
  params,
}: {
  params: Promise<{ shortSlug: string }>;
}) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{
    shortSlug: string;
  } | null>(null);
  const [results, setResults] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const { updateProgress: updateProgressComplete } =
    useProgressTrackingComplete();
  const { updateProgress: updateProgressBasic } = useProgressTracking();
  const [nextModuleHref, setNextModuleHref] = useState<string | null>(null);
  const [nextModuleTitle, setNextModuleTitle] = useState<string | null>(null);
  const [nextLessonTitle, setNextLessonTitle] = useState<string | null>(null);
  const { nextLessonHref } = useNextUnlockedLesson();
  const [moduleTitle, setModuleTitle] = useState<string | null>(null);

  const progressAppliedRef = useRef(false);
  const debugUpdateCompleteCountRef = useRef(0);

  // Resolve the params promise
  useEffect(() => {
    if (progressAppliedRef.current) {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[Results] progress update skipped (already applied)");
      }
      return;
    }
    const resolveParams = async () => {
      try {
        const { shortSlug } = await params;
        setResolvedParams({ shortSlug });
        // Load quiz session from sessionStorage
        const sessionKey = `quizSession:${shortSlug}`;
        const raw =
          typeof window !== "undefined"
            ? sessionStorage.getItem(sessionKey)
            : null;
        if (!raw) {
          setLoading(false);
          return;
        }
        const session = JSON.parse(raw);
        const totalQuestions: number = session?.questions?.length ?? 0;
        const answers: Array<{
          selectedIndex?: number;
          enteredText?: string;
          correct: boolean;
        } | null> = session?.answers ?? [];
        const correctAnswers = answers.reduce(
          (acc, a) => acc + (a?.correct ? 1 : 0),
          0,
        );
        const score =
          totalQuestions > 0
            ? Math.round((correctAnswers / totalQuestions) * 100)
            : 0;
        const passingScore: number = session?.passingScore ?? 70;
        const passed = score >= passingScore;
        const startedAt: number = session?.startedAt ?? Date.now();
        const timeLimitMin: number = session?.timeLimit ?? 30;
        const formatMinSec = (ms: number) => {
          const totalSec = Math.max(0, Math.floor(ms / 1000));
          const m = Math.floor(totalSec / 60);
          const s = totalSec % 60;
          return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        };
        const timeTaken = formatMinSec(Date.now() - startedAt);
        const timeLimit = `${String(timeLimitMin).padStart(2, "0")}:00`;

        // Category breakdown by question topic
        const categories: Record<string, { correct: number; total: number }> =
          {};
        (session?.questions ?? []).forEach(
          (q: ProgrammingQuestion, idx: number) => {
            const cat = q?.topic || "General";
            if (!categories[cat]) categories[cat] = { correct: 0, total: 0 };
            categories[cat].total += 1;
            const a = answers[idx];
            if (a?.correct) categories[cat].correct += 1;
          },
        );
        const categoryScores: CategoryScore[] = Object.entries(categories).map(
          ([category, stats]) => ({
            category,
            correct: stats.correct,
            total: stats.total,
          }),
        );

        const computedResults = {
          totalQuestions,
          correctAnswers,
          score,
          passingScore,
          timeTaken,
          timeLimit,
          passed,
          categoryScores,
        };

        setResults(computedResults);
        setLoading(false);
        if (passed) {
          try {
            // Resolve module name from registry
            let moduleName = shortSlug
              .replace(/-/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
            try {
              const res = await fetch("/api/content/registry", {
                cache: "no-store",
              });
              if (res.ok) {
                const data = await res.json();
                const modules: Array<{
                  title?: string;
                  routes?: { overview?: string };
                }> = Array.isArray(data?.modules) ? data.modules : [];
                const match = modules.find(
                  (m) => m?.routes?.overview === `/${shortSlug}`,
                );
                if (match?.title) moduleName = String(match.title);
              }
            } catch {}

            // Try to compute accurate lessons count via API
            let lessonsCount = 0;
            try {
              const lessonsRes = await fetch(
                `/api/content/lessons/${shortSlug}`,
                { cache: "no-store" },
              );
              if (lessonsRes.ok) {
                const lessons = await lessonsRes.json();
                lessonsCount = Array.isArray(lessons) ? lessons.length : 0;
              }
            } catch (err) {
              console.warn(
                "Unable to load lessons for completion update:",
                err,
              );
            }

            // Update enhanced tracker (includes moduleName and richer stats)
            updateProgressComplete(shortSlug, moduleName, {
              quizScore: score,
              ...(lessonsCount > 0
                ? { totalLessons: lessonsCount, lessonsCompleted: lessonsCount }
                : {}),
            });
            debugUpdateCompleteCountRef.current += 1;
            if (process.env.NODE_ENV !== "production") {
              console.debug(`[Results] updateProgressComplete called`, {
                shortSlug,
                count: debugUpdateCompleteCountRef.current,
                score,
              });
            }

            // Update basic tracker to keep fullstack progress in sync
            updateProgressBasic(shortSlug, {
              quizScore: score,
              ...(lessonsCount > 0
                ? { totalLessons: lessonsCount, lessonsCompleted: lessonsCount }
                : {}),
            });

            setShowConfetti(true);
            progressAppliedRef.current = true;
          } catch (e) {
            console.error("Failed to update progress", e);
          }
        }
      } catch (error) {
        console.error("Error resolving params:", error);
      }
    };

    resolveParams();
  }, [params, updateProgressComplete, updateProgressBasic]);

  // Compute next module route once params are resolved
  useEffect(() => {
    const computeNext = async () => {
      if (!resolvedParams) return;
      try {
        const res = await fetch("/api/content/registry", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const modules: Array<{
          slug?: string;
          title?: string;
          tier?: string;
          order?: number;
          routes?: { overview?: string; lessons?: string };
        }> = Array.isArray(data?.modules) ? data.modules : [];
        const tiers: Record<string, { level?: number }> =
          data?.tiers && typeof data.tiers === "object" ? data.tiers : {};
        const current = modules.find(
          (m) => m?.routes?.overview === `/${resolvedParams.shortSlug}`,
        );
        if (!current) return;
        setModuleTitle(current.title ? String(current.title) : null);
        const currentTier = String(current.tier || "core");
        const tierModules = modules
          .filter((m) => String(m.tier || "core") === currentTier)
          .map((m) => ({
            slug: String(m.slug || ""),
            title: String(m.title || ""),
            order: typeof m.order === "number" ? m.order : 0,
            routes: m.routes || { overview: "", lessons: "" },
          }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        const idx = tierModules.findIndex(
          (m) => m.slug === String(current.slug || ""),
        );
        let next: (typeof tierModules)[number] | null = null;
        if (idx >= 0 && idx < tierModules.length - 1) {
          next = tierModules[idx + 1];
        } else {
          const tierLevels = Object.keys(tiers).sort(
            (a, b) =>
              Number(tiers[a]?.level || 0) - Number(tiers[b]?.level || 0),
          );
          const currentIdx = tierLevels.findIndex((t) => t === currentTier);
          if (currentIdx >= 0 && currentIdx < tierLevels.length - 1) {
            const nextTierKey = tierLevels[currentIdx + 1];
            const nextTierModules = modules
              .filter((m) => String(m.tier || "core") === nextTierKey)
              .map((m) => ({
                slug: String(m.slug || ""),
                title: String(m.title || ""),
                order: typeof m.order === "number" ? m.order : 0,
                routes: m.routes || { overview: "", lessons: "" },
              }))
              .sort((a, b) => (a.order || 0) - (b.order || 0));
            if (nextTierModules.length > 0) next = nextTierModules[0];
          }
        }
        if (next) {
          try {
            const resLessons = await fetch(
              `/api/content/lessons/${next.slug}`,
              { cache: "no-store" },
            );
            const lessons = resLessons.ok ? await resLessons.json() : [];
            let firstLessonIndex = 0;
            if (Array.isArray(lessons) && lessons.length > 0) {
              firstLessonIndex = 0;
            }
            const lessonsPath = next.routes?.lessons || `/${next.slug}/lessons`;
            const shouldAppendOrder = lessonsPath.startsWith("/modules/");
            const href = shouldAppendOrder
              ? `${lessonsPath}/${firstLessonIndex + 1}`
              : lessonsPath;
            setNextModuleHref(href);
          } catch {
            setNextModuleHref(`/${next.slug}`);
          }
          setNextModuleTitle(next.title ?? null);
        }
      } catch (e) {
        console.error("Error computing next module:", e);
      }
    };
    computeNext();
  }, [resolvedParams]);

  // Resolve the title for the next lesson link (module title behind lessons path)
  useEffect(() => {
    const resolveNextLessonTitle = async () => {
      try {
        if (!nextLessonHref) {
          setNextLessonTitle(null);
          return;
        }
        const res = await fetch("/api/content/registry", { cache: "no-store" });
        const data = res.ok ? await res.json() : {};
        const modules: Array<{
          title?: string;
          routes?: { lessons?: string };
        }> = Array.isArray(data?.modules) ? data.modules : [];
        let candidatePath = nextLessonHref;
        if (
          candidatePath.startsWith("/modules/") &&
          candidatePath.includes("/lessons/")
        ) {
          candidatePath = candidatePath.replace(/\/lessons\/.*$/, "/lessons");
        }
        const target = modules.find(
          (m) => m?.routes?.lessons === candidatePath,
        );
        setNextLessonTitle(target?.title ?? null);
      } catch {
        setNextLessonTitle(null);
      }
    };
    resolveNextLessonTitle();
  }, [nextLessonHref]);

  const handleRetakeQuiz = () => {
    if (!resolvedParams) return;

    // Clear existing quiz session data to ensure a fresh start
    try {
      const sessionKey = `quizSession:${resolvedParams.shortSlug}`;
      const seedKey = `quizSeed:${resolvedParams.shortSlug}`;

      // Remove quiz session and seed data for a fresh start
      sessionStorage.removeItem(sessionKey);
      sessionStorage.removeItem(seedKey);
      // Note: We keep the quiz history to maintain question diversity across attempts
    } catch (error) {
      console.warn("Failed to clear session storage:", error);
    }

    // Navigate to quiz start page for a fresh quiz
    router.push(`/${resolvedParams.shortSlug}/quiz`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="glass-morphism p-12 rounded-xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Calculating your results...</p>
        </div>
      </div>
    );
  }

  if (!resolvedParams || !results) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="glass-morphism p-12 rounded-xl text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold text-danger mb-4">
            Error Loading Results
          </h2>
          <p className="text-muted mb-6">
            Unable to load quiz results. Please try again.
          </p>
          <div className="flex justify-start">
            <Link
              href={`/${resolvedParams?.shortSlug || ""}/quiz`}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-fg rounded-lg hover:opacity-90 transition-colors"
            >
              ← Back to Quiz
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { shortSlug } = resolvedParams;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <ConfettiBurst active={showConfetti} durationMs={4500} />
      {/* Breadcrumb Navigation */}
      <nav className="mb-8" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link href="/" className="text-primary hover:opacity-90">
              Home
            </Link>
          </li>
          <li className="text-muted">/</li>
          <li>
            <Link
              href={`/${shortSlug}`}
              className="text-primary hover:opacity-90"
            >
              {moduleTitle ||
                shortSlug
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
            </Link>
          </li>
          <li className="text-muted">/</li>
          <li>
            <Link
              href={`/${shortSlug}/quiz`}
              className="text-primary hover:opacity-90"
            >
              Quiz
            </Link>
          </li>
          <li className="text-muted">/</li>
          <li className="text-fg font-medium">Results</li>
        </ol>
      </nav>

      {/* Results Summary */}
      <QuizResult
        moduleName={moduleTitle ?? shortSlug}
        score={results.correctAnswers}
        total={results.totalQuestions}
        onRetry={handleRetakeQuiz}
        nextLessonHref={
          results.passed && nextLessonHref ? nextLessonHref : undefined
        }
        nextModuleHref={
          results.passed && !nextLessonHref && nextModuleHref
            ? nextModuleHref
            : undefined
        }
        nextLessonTitle={
          results.passed ? (nextLessonTitle ?? undefined) : undefined
        }
        nextModuleTitle={
          results.passed ? (nextModuleTitle ?? undefined) : undefined
        }
        passThresholdPercent={results.passingScore}
      />
      <div className="mt-6 text-center text-sm text-muted">
        Time Taken: <span className="font-semibold">{results.timeTaken}</span> •
        Time Limit: <span className="font-semibold">{results.timeLimit}</span>
      </div>
    </div>
  );
}
