"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ConfettiBurst from '@/components/ConfettiBurst';
import { useProgressTrackingComplete } from '@/hooks/useProgressTrackingComplete';
import { useProgressTracking } from '@/hooks/useProgressTracking';
import { useNextUnlockedLesson } from '@/hooks/useNextUnlockedLesson';
import { contentRegistry } from '@/lib/contentRegistry';
import type { ProgrammingQuestion, Module } from '@/lib/contentRegistry';
import QuizResult from '@/components/QuizResult';
import { getModuleTheme } from '@/lib/moduleThemes';

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
export default function QuizResultsPage({ params }: { params: Promise<{ shortSlug: string }> }) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ shortSlug: string } | null>(null);
  const [results, setResults] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const { updateProgress: updateProgressComplete } = useProgressTrackingComplete();
  const { updateProgress: updateProgressBasic } = useProgressTracking();
  const [nextModuleHref, setNextModuleHref] = useState<string | null>(null);
  const [nextModuleTitle, setNextModuleTitle] = useState<string | null>(null);
  const [nextLessonTitle, setNextLessonTitle] = useState<string | null>(null);
  const { nextLessonHref } = useNextUnlockedLesson();
  const [moduleTitle, setModuleTitle] = useState<string | null>(null);
  const [theme, setTheme] = useState(getModuleTheme(''));

  // Resolve the params promise
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const { shortSlug } = await params;
        setResolvedParams({ shortSlug });
        // Load quiz session from sessionStorage
        const sessionKey = `quizSession:${shortSlug}`;
        const raw = typeof window !== 'undefined' ? sessionStorage.getItem(sessionKey) : null;
        if (!raw) {
          setLoading(false);
          return;
        }
        const session = JSON.parse(raw);
        const totalQuestions: number = session?.questions?.length ?? 0;
        const answers: Array<{ selectedIndex?: number; enteredText?: string; correct: boolean } | null> = session?.answers ?? [];
        const correctAnswers = answers.reduce((acc, a) => acc + (a?.correct ? 1 : 0), 0);
        const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
        const passingScore: number = session?.passingScore ?? 70;
        const passed = score >= passingScore;
        const startedAt: number = session?.startedAt ?? Date.now();
        const timeLimitMin: number = session?.timeLimit ?? 30;
        const formatMinSec = (ms: number) => {
          const totalSec = Math.max(0, Math.floor(ms / 1000));
          const m = Math.floor(totalSec / 60);
          const s = totalSec % 60;
          return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        };
        const timeTaken = formatMinSec(Date.now() - startedAt);
        const timeLimit = `${String(timeLimitMin).padStart(2, '0')}:00`;

        // Category breakdown by question topic
        const categories: Record<string, { correct: number; total: number }> = {};
        (session?.questions ?? []).forEach((q: ProgrammingQuestion, idx: number) => {
          const cat = q?.topic || 'General';
          if (!categories[cat]) categories[cat] = { correct: 0, total: 0 };
          categories[cat].total += 1;
          const a = answers[idx];
          if (a?.correct) categories[cat].correct += 1;
        });
        const categoryScores: CategoryScore[] = Object.entries(categories).map(([category, stats]) => ({
          category,
          correct: stats.correct,
          total: stats.total
        }));

        const computedResults = {
          totalQuestions,
          correctAnswers,
          score,
          passingScore,
          timeTaken,
          timeLimit,
          passed,
          categoryScores
        };

        setResults(computedResults);
        setLoading(false);
        if (passed) {
          try {
            const mod = await contentRegistry.getModule(shortSlug);
            setTheme(getModuleTheme(mod?.slug || shortSlug));
            const moduleName = mod?.title ?? shortSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            // Try to compute accurate lessons count from registry
            let lessonsCount = 0;
            try {
              const lessons = await contentRegistry.getModuleLessons(shortSlug);
              lessonsCount = Array.isArray(lessons) ? lessons.length : 0;
            } catch (err) {
              console.warn('Unable to load lessons for completion update:', err);
            }

            // Update enhanced tracker (includes moduleName and richer stats)
            updateProgressComplete(shortSlug, moduleName, {
              quizScore: score,
              ...(lessonsCount > 0 ? { totalLessons: lessonsCount, lessonsCompleted: lessonsCount } : {})
            });

            // Update basic tracker to keep fullstack progress in sync
            updateProgressBasic(shortSlug, {
              quizScore: score,
              ...(lessonsCount > 0 ? { totalLessons: lessonsCount, lessonsCompleted: lessonsCount } : {})
            });

            setShowConfetti(true);
          } catch (e) {
            console.error('Failed to update progress', e);
          }
        }
      } catch (error) {
        console.error('Error resolving params:', error);
      }
    };

    resolveParams();
  }, [params]);

  // Compute next module route once params are resolved
  useEffect(() => {
    const computeNext = async () => {
      if (!resolvedParams) return;
      try {
        const current = await contentRegistry.getModule(resolvedParams.shortSlug);
        if (!current) return;
        setModuleTitle(current.title ?? null);
        // Next module within same tier by order; if none, next tier's first
        const tierModules = await contentRegistry.getModulesByTier(current.tier);
        const idx = tierModules.findIndex(m => m.slug === current.slug);
        let next: typeof tierModules[number] | null = null;
        if (idx >= 0 && idx < tierModules.length - 1) {
          next = tierModules[idx + 1];
        } else {
          // move to next tier level
          const tiers = await contentRegistry.getTiers();
          const tierLevels = Object.keys(tiers).sort((a, b) =>
            (tiers[a].level ?? 0) - (tiers[b].level ?? 0)
          );
          const currentIdx = tierLevels.findIndex(t => t === current.tier);
          if (currentIdx >= 0 && currentIdx < tierLevels.length - 1) {
            const nextTierKey = tierLevels[currentIdx + 1];
            const nextTierModules = await contentRegistry.getModulesByTier(nextTierKey);
            if (nextTierModules.length > 0) next = nextTierModules[0];
          }
        }
        if (next) {
          try {
            const lessons = await contentRegistry.getModuleLessons(next.slug);
            // Compute first lesson index similar to hook
            let firstLessonIndex = 0;
            if (Array.isArray(lessons) && lessons.length > 0) {
              firstLessonIndex = 0;
            }
            const lessonsPath = next.routes.lessons;
            const shouldAppendOrder = lessonsPath.startsWith('/modules/');
            const href = shouldAppendOrder ? `${lessonsPath}/${firstLessonIndex + 1}` : lessonsPath;
            setNextModuleHref(href);
          } catch {
            setNextModuleHref(`/modules/${next.slug}`);
          }
          setNextModuleTitle(next.title ?? null);
        }
      } catch (e) {
        console.error('Error computing next module:', e);
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
        const modules = await contentRegistry.getModules();
        let candidatePath = nextLessonHref;
        if (candidatePath.startsWith('/modules/') && candidatePath.includes('/lessons/')) {
          candidatePath = candidatePath.replace(/\/lessons\/.*$/, '/lessons');
        }
        const target = modules.find((m: Module) => m?.routes?.lessons === candidatePath);
        setNextLessonTitle(target ? target.title : null);
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
      console.warn('Failed to clear session storage:', error);
    }
    
    // Navigate to quiz start page for a fresh quiz
    router.push(`/${resolvedParams.shortSlug}/quiz`);
  };

  const handleReviewLessons = async () => {
    if (!resolvedParams) return;
    try {
      const mod = await contentRegistry.getModule(resolvedParams.shortSlug);
      if (mod) {
        const lessonsPath = mod.routes.lessons;
        const href = lessonsPath.startsWith('/modules/') ? `${lessonsPath}/1` : lessonsPath;
        router.push(href);
        return;
      }
    } catch (e) {
      console.error('Failed to resolve module lessons route', e);
    }
    router.push(`/${resolvedParams.shortSlug}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="glass-morphism p-12 rounded-xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Calculating your results...</p>
        </div>
      </div>
    );
  }

  if (!resolvedParams || !results) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="glass-morphism p-12 rounded-xl text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-4">
            Error Loading Results
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Unable to load quiz results. Please try again.
          </p>
          <div className="flex justify-start">
            <Link
              href={`/${resolvedParams?.shortSlug || ''}/quiz`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              Home
            </Link>
          </li>
          <li className="text-gray-500">/</li>
          <li>
            <Link href={`/${shortSlug}`} className="text-blue-600 hover:text-blue-800">
              Module
            </Link>
          </li>
          <li className="text-gray-500">/</li>
          <li>
            <Link href={`/${shortSlug}/quiz`} className="text-blue-600 hover:text-blue-800">
              Quiz
            </Link>
          </li>
          <li className="text-gray-500">/</li>
          <li className="text-gray-900 dark:text-gray-100 font-medium">
            Results
          </li>
        </ol>
      </nav>

      {/* Results Header using shared component */}
      <header className="mb-12">
        <div className="glass-morphism p-8 rounded-xl">
          <QuizResult
            moduleName={moduleTitle ?? shortSlug}
            score={results.correctAnswers}
            total={results.totalQuestions}
            onRetry={handleRetakeQuiz}
            nextLessonHref={results.passed && nextLessonHref ? nextLessonHref : undefined}
            nextModuleHref={results.passed && !nextLessonHref && nextModuleHref ? nextModuleHref : undefined}
            nextLessonTitle={results.passed ? nextLessonTitle ?? undefined : undefined}
            nextModuleTitle={results.passed ? nextModuleTitle ?? undefined : undefined}
            passThresholdPercent={results.passingScore}
          />
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
            Time Taken: <span className="font-semibold">{results.timeTaken}</span> • Time Limit: <span className="font-semibold">{results.timeLimit}</span>
          </div>
        </div>
      </header>

      {/* Performance by Category */}
      <section className="mb-12">
        <div className="glass-morphism p-8 rounded-xl">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            📊 Performance by Category
          </h2>
          
          <div className="space-y-4">
            {results.categoryScores.map((category: CategoryScore, index: number) => {
              const percentage = Math.round((category.correct / category.total) * 100);
              const isPerfect = category.correct === category.total;
              const isGood = percentage >= 70;
              
              return (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {category.category}
                    </h3>
                    <span className={`font-semibold ${
                      isPerfect 
                        ? "text-green-600 dark:text-green-400" 
                        : isGood 
                          ? "text-blue-600 dark:text-blue-400" 
                          : "text-yellow-600 dark:text-yellow-400"
                    }`}>
                      {category.correct}/{category.total} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        isPerfect 
                          ? "bg-green-500" 
                          : isGood 
                            ? "bg-blue-500" 
                            : "bg-yellow-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="mb-12">
        <div className="glass-morphism p-8 rounded-xl">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            🎯 Next Steps
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                📚 Review Lessons
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Strengthen your understanding by reviewing the module lessons.
              </p>
              <button
                onClick={handleReviewLessons}
                className={`w-full px-4 py-2 rounded-lg transition-colors ${theme.button}`}
              >
                Review Lessons
              </button>
            </div>
            
            {results.passed && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  🚀 Continue Learning
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Move on to the next module to continue your learning journey.
                </p>
                {nextLessonHref ? (
                  <div className="flex justify-end">
                    <Link
                      href={nextLessonHref}
                      className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${theme.button}`}
                    >
                      {nextLessonTitle ? `Start ${nextLessonTitle}` : 'Start Next Lesson'}
                    </Link>
                  </div>
                ) : nextModuleHref ? (
                  <div className="flex justify-end">
                    <Link
                      href={nextModuleHref}
                      className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${theme.button}`}
                    >
                      {nextModuleTitle ? `Start ${nextModuleTitle}` : 'Start Next Module'}
                    </Link>
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <Link
                      href={`/${resolvedParams?.shortSlug ?? ''}`}
                      className={`inline-flex items-center px-4 py-2 transition-colors ${theme.link}`}
                    >
                      ← Back to Module Overview
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Navigation Footer */}
      <footer className="flex justify-start">
        <Link
          href={`/${resolvedParams?.shortSlug ?? ''}`}
          className={`inline-flex items-center px-4 py-2 transition-colors ${theme.link}`}
        >
          ← Back to Module Overview
        </Link>
      </footer>
    </div>
  );
}