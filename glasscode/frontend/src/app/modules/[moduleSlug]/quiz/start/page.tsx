"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { contentRegistry } from '@/lib/contentRegistry';
import type { ProgrammingQuestion } from '@/lib/contentRegistry';

// For client components in Next.js 15, params are still Promises that need to be awaited
export default function QuizStartPage({ params }: { params: Promise<{ moduleSlug: string }> }) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ moduleSlug: string } | null>(null);
  const [poolCount, setPoolCount] = useState<number>(0);
  const [debugEnabled, setDebugEnabled] = useState<boolean>(false);
  interface QuizOverview {
    title: string;
    totalQuestions: number;
    timeLimit: number;
    passingScore: number;
    instructions: string[];
    _sessionSeed: {
      selectedQuestions: ProgrammingQuestion[];
      passingScore: number;
      timeLimit: number;
    };
  }
  const [quizData, setQuizData] = useState<QuizOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve the params promise
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const { moduleSlug } = await params;
        setResolvedParams({ moduleSlug });
        // Enable debug view if query param is present
        if (typeof window !== 'undefined') {
          try {
            const qp = new URLSearchParams(window.location.search);
            setDebugEnabled(qp.get('debug') === '1');
          } catch {}
        }
        // Load module and quiz from content registry
        const [mod, quiz] = await Promise.all([
          contentRegistry.getModule(moduleSlug),
          contentRegistry.getModuleQuiz(moduleSlug)
        ]);

        if (!mod || !quiz || !quiz.questions || quiz.questions.length === 0) {
          setError("Quiz data not available for this module");
          setLoading(false);
          return;
        }

        // Normalize questions: trim text, ensure valid fields for multiple-choice OR open-ended
        // Support local JSON that uses `correctIndex` by mapping it to `correctAnswer`
        const sanitizedQuestions = (quiz.questions || [])
          .map((q) => {
            const rawChoices = q.choices ?? [];
            const normalizedChoices = Array.isArray(rawChoices)
              ? rawChoices.map((c) => (typeof c === 'string' ? c.trim() : String(c)))
              : [];
            const normalizedAccepted = Array.isArray(q.acceptedAnswers)
              ? q.acceptedAnswers.map((a) => (typeof a === 'string' ? a.trim() : String(a))).filter(Boolean)
              : [];
            const effectiveCorrect =
              typeof q.correctAnswer === 'number'
                ? q.correctAnswer
                : typeof (q as unknown as { correctIndex?: number }).correctIndex === 'number'
                ? (q as unknown as { correctIndex: number }).correctIndex
                : undefined;

            // Determine question type
            const inferredType = normalizedAccepted.length > 0 ? 'open-ended' : 'multiple-choice';

            return {
              ...q,
              question: (q.question || '').trim(),
              choices: normalizedChoices,
              acceptedAnswers: normalizedAccepted.length > 0 ? normalizedAccepted : q.acceptedAnswers,
              // Ensure `correctAnswer` is set for downstream logic when applicable
              correctAnswer: effectiveCorrect,
              type: q.type || inferredType,
            } as ProgrammingQuestion;
          })
          .filter((q) => {
            const hasQuestionText = typeof q.question === 'string' && q.question.trim().length > 0;
            const isOpenEnded = (q.type === 'open-ended') || ((q.acceptedAnswers ?? []).length > 0);
            if (isOpenEnded) {
              const hasAccepted = Array.isArray(q.acceptedAnswers) && q.acceptedAnswers.length > 0;
              return hasQuestionText && hasAccepted;
            }
            // multiple-choice validation
            const choices = q.choices ?? [];
            const hasChoices = Array.isArray(choices) && choices.length > 0;
            const hasValidIndex =
              typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer < choices.length;
            return hasQuestionText && hasChoices && hasValidIndex;
          });

        // Determine target number of questions and pool size
        const availableQuestions = sanitizedQuestions.length;
        setPoolCount(availableQuestions);
        // Select target number of questions using per-module config; default to 14
        const desiredCount = (
          mod.metadata?.thresholds?.minQuizQuestions ??
          mod.thresholds?.requiredQuestions ??
          14
        );
        const targetQuestions = Math.min(desiredCount, availableQuestions);
        // Sample from the full available pool to maximize variety across attempts
        const poolSize = availableQuestions;

        // Create a shuffled selection pool
        const shuffle = <T,>(arr: T[]): T[] => {
          const a = [...arr];
          for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
          }
          return a;
        };

        const pool = shuffle(sanitizedQuestions).slice(0, poolSize);
        const selectedQuestions = shuffle(pool).slice(0, targetQuestions);

        // Randomize choice order for each selected question and update correct answer index
        const randomizedSelectedQuestions = selectedQuestions.map((q) => {
          const isOpenEnded = (q.type === 'open-ended') || ((q.acceptedAnswers ?? []).length > 0);
          if (isOpenEnded) return q; // no choice shuffling for open-ended

          const hasChoices = Array.isArray(q.choices) && q.choices.length > 1;
          const hasCorrectIndex = typeof q.correctAnswer === 'number' && q.correctAnswer >= 0;
          if (!hasChoices || !hasCorrectIndex) return q;

          const indices = q.choices!.map((_, i) => i);
          const shuffledIndices = shuffle(indices);
          const newChoices = shuffledIndices.map((i) => q.choices![i]);
          const newCorrectIndex = shuffledIndices.indexOf(q.correctAnswer!);
          return {
            ...q,
            choices: newChoices,
            correctAnswer: newCorrectIndex,
            type: 'multiple-choice',
          } as ProgrammingQuestion;
        });

        // Compute time limit: use metadata passingScore/time or fallback by question count
        // Base: 1.5 minutes per question, min 10, max 45
        const defaultPerQuestion = 1.5; // minutes
        const computedByCount = Math.round(Math.min(45, Math.max(10, selectedQuestions.length * defaultPerQuestion)));
        const timeLimit = computedByCount;
        const passingScore = mod.metadata?.thresholds?.passingScore ?? 70;

        const quizOverview = {
          title: `${mod.title} Quiz`,
          totalQuestions: randomizedSelectedQuestions.length,
          timeLimit,
          passingScore,
          instructions: [
            `You have ${timeLimit} minutes to complete this quiz`,
            "Each question has only one correct answer",
            "You can navigate between questions using the navigation buttons",
            "Your progress will be saved automatically",
            "Good luck!"
          ],
          _sessionSeed: {
            selectedQuestions: randomizedSelectedQuestions,
            passingScore,
            timeLimit
          }
        };

        setQuizData(quizOverview);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load quiz data', err);
        setError("Failed to load quiz data");
        setLoading(false);
      }
    };

    resolveParams();
  }, [params]);

  const handleStartQuiz = () => {
    if (!resolvedParams) return;
    // Create quiz session in sessionStorage and start quiz
    try {
      const sessionKey = `quizSession:${resolvedParams.moduleSlug}`;
      const seed = quizData?._sessionSeed;
      if (!seed) {
        setError('Quiz session setup failed');
        return;
      }
      const sessionPayload = {
        questions: seed.selectedQuestions,
        totalQuestions: seed.selectedQuestions.length,
        passingScore: seed.passingScore,
        timeLimit: seed.timeLimit,
        startedAt: Date.now(),
        answers: Array(seed.selectedQuestions.length).fill(null) as Array<{
          selectedIndex?: number;
          enteredText?: string;
          correct: boolean;
        } | null>
      };
      sessionStorage.setItem(sessionKey, JSON.stringify(sessionPayload));
      router.push(`/modules/${resolvedParams.moduleSlug}/quiz/question/1`);
    } catch (e) {
      console.error('Failed to initialize quiz session', e);
      setError('Failed to initialize quiz session');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="glass-morphism p-12 rounded-xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!resolvedParams || error) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="glass-morphism p-12 rounded-xl text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-4">
            Error Loading Quiz
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error || "Failed to load quiz"}
          </p>
          <Link
            href={`/modules/${resolvedParams?.moduleSlug || ''}/quiz`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Quiz Overview
          </Link>
        </div>
      </div>
    );
  }

  const { moduleSlug } = resolvedParams;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
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
            <Link href={`/modules/${moduleSlug}`} className="text-blue-600 hover:text-blue-800">
              Module
            </Link>
          </li>
          <li className="text-gray-500">/</li>
          <li>
            <Link href={`/modules/${moduleSlug}/quiz`} className="text-blue-600 hover:text-blue-800">
              Quiz
            </Link>
          </li>
          <li className="text-gray-500">/</li>
          <li className="text-gray-900 dark:text-gray-100 font-medium">
            Start
          </li>
        </ol>
      </nav>

      {/* Quiz Start Header */}
      <header className="mb-12">
        <div className="glass-morphism p-8 rounded-xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Test Your Knowledge?
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
              {quizData?.title}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                  {quizData?.totalQuestions}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Questions
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-300">
                  {quizData?.timeLimit} min
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Time Limit
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                  {quizData?.passingScore}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Passing Score
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Quiz Instructions */}
      <section className="mb-12">
        <div className="glass-morphism p-8 rounded-xl">
          {debugEnabled && quizData?._sessionSeed?.selectedQuestions && (
            <div className="mb-6 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Debug</div>
              <div className="text-xs text-gray-700 dark:text-gray-200">Pool size: {poolCount}</div>
              <div className="text-xs text-gray-700 dark:text-gray-200">Selected IDs: {quizData._sessionSeed.selectedQuestions.map(q => q.id).join(', ')}</div>
            </div>
          )}
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            📋 Quiz Instructions
          </h2>
          
          <ul className="space-y-4 mb-8">
            {quizData?.instructions.map((instruction: string, index: number) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  {index + 1}
                </span>
                <span className="text-gray-700 dark:text-gray-300">{instruction}</span>
              </li>
            ))}
          </ul>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Important
                </h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  Once you start the quiz, the timer will begin and cannot be paused. 
                  Make sure you&apos;re ready before clicking Start Quiz.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex justify-start">
              <Link
                href={`/modules/${moduleSlug}/quiz`}
                className="inline-flex items-center px-8 py-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-lg font-medium"
              >
                ← Cancel
              </Link>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleStartQuiz}
                className="inline-flex items-center px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-medium"
              >
                Start Quiz
                <span className="ml-2">🎯</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Footer */}
      <footer className="flex justify-center">
        <Link
          href={`/modules/${moduleSlug}/quiz`}
          className="inline-flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Back to Quiz Overview
        </Link>
      </footer>
    </div>
  );
}