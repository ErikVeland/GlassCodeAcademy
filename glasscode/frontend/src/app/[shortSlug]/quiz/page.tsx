"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { contentRegistry } from '@/lib/contentRegistry';
import type { ProgrammingQuestion, Module } from '@/lib/contentRegistry';
import QuizLayout from '@/components/QuizLayout';
import LoadingScreen from '@/components/LoadingScreen';

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

export default function QuizPage({ params }: { params: Promise<{ shortSlug: string }> }) {
  const router = useRouter();
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [quiz, setQuiz] = useState<{ questions: ProgrammingQuestion[] } | null>(null);
  const [thresholds, setThresholds] = useState<{
    quizValid: boolean;
    lessonsValid: boolean;
    lessons?: boolean;
    quiz?: boolean;
  } | null>(null);
  const [unlockingModules, setUnlockingModules] = useState<{
    slug: string;
    title: string;
    routes: { overview: string };
  }[]>([]);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poolCount, setPoolCount] = useState(0);
  const [reqPercent, setReqPercent] = useState(0);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [prefetchStatus, setPrefetchStatus] = useState<{ isPrefetching: boolean; prefetchedCount: number; queueLength: number } | null>(null);
  const prefetchCheckInterval = useRef<NodeJS.Timeout | null>(null);

  const initializeQuizData = useCallback(async (
    moduleData: typeof currentModule,
    moduleQuiz: typeof quiz,
    moduleThresholds: typeof thresholds
  ) => {
    console.log('=== initializeQuizData Debug ===');
    console.log('moduleData:', moduleData);
    console.log('moduleQuiz:', moduleQuiz);
    console.log('moduleQuiz?.questions:', moduleQuiz?.questions);
    console.log('moduleQuiz?.questions?.length:', moduleQuiz?.questions?.length);
    
    // Add null checks at the beginning
    if (!moduleData) {
      console.log('Early return: No module data');
      return;
    }
    
    if (!moduleQuiz?.questions || moduleQuiz.questions.length === 0) {
      console.log('Early return: No quiz questions available');
      return;
    }

    try {
      const targetQuestions = moduleData.metadata?.thresholds?.minQuizQuestions ?? moduleData.thresholds?.requiredQuestions ?? 14;
      const allQuestions = moduleQuiz.questions;
      setPoolCount(allQuestions.length);
      console.log('Pool count set to:', allQuestions.length);

      // Get history from localStorage to avoid recently used questions
      const historyKey = `quiz_history_${moduleData.slug}`;
      const historyData = localStorage.getItem(historyKey);
      const recentQuestionIds = historyData ? JSON.parse(historyData) : [];

      // Filter out recently used questions
      const availableQuestions = allQuestions.filter((q: ProgrammingQuestion) => !recentQuestionIds.includes(q.id));
      const questionsToUse = availableQuestions.length >= targetQuestions ? availableQuestions : allQuestions;

      // Shuffle and select questions
      const shuffled = [...questionsToUse].sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, targetQuestions);
      console.log('Selected questions count:', selectedQuestions.length);

      // Randomize choice order for multiple choice questions AND preserve correctAnswer index
      const processedQuestions = selectedQuestions.map((question: ProgrammingQuestion) => {
        if (question.type === 'multiple-choice' && question.choices && !question.fixedChoiceOrder) {
          const originalChoices = question.choices;
          const originalCorrectIndex = typeof question.correctAnswer === 'number' ? question.correctAnswer : -1;
          const originalCorrectChoice = originalCorrectIndex >= 0 && originalCorrectIndex < originalChoices.length
            ? originalChoices[originalCorrectIndex]
            : undefined;
          const shuffledChoices = [...originalChoices].sort(() => Math.random() - 0.5);
          let newCorrectIndex = originalCorrectIndex;
          if (originalCorrectChoice !== undefined) {
            const idx = shuffledChoices.findIndex(c => c === originalCorrectChoice);
            newCorrectIndex = idx >= 0 ? idx : 0; // fallback to 0 if not found
          }
          return { ...question, choices: shuffledChoices, correctAnswer: newCorrectIndex };
        }
        return question;
      });
      if (debugEnabled) {
        console.log('Selected IDs:', processedQuestions.map((q: ProgrammingQuestion) => q.id));
      }

      // Calculate time limit and passing score
      const timeLimit = Math.min(Math.max(Math.ceil(targetQuestions * 1.5), 10), 45);
      const passingScore = moduleData.metadata?.thresholds?.passingScore || 70;

      // Calculate requirement percentage
      const reqPercentage = ((moduleThresholds?.lessons ? 50 : 0) + (moduleThresholds?.quiz ? 50 : 0)) || 0;
      setReqPercent(reqPercentage);

      const quizOverview: QuizData = {
        title: `${moduleData.title} Assessment`,
        totalQuestions: targetQuestions,
        timeLimit,
        passingScore,
        instructions: [
          `You will answer ${targetQuestions} questions covering key concepts from the ${moduleData.title} module.`,
          'Questions are randomly selected from a larger pool to keep each attempt fresh.',
          'Read each question carefully before selecting your answer.',
          'You can review and change your answers before submitting.',
          `You need ${passingScore}% or higher to pass this assessment.`,
          'The timer will start as soon as you begin the quiz.',
          'Make sure you have a stable internet connection before starting.'
        ],
        _sessionSeed: { selectedQuestions: processedQuestions }
      };

      console.log('Setting quizData:', quizOverview);
      setQuizData(quizOverview);

      // Store session seed for debugging
      if (debugEnabled) {
        sessionStorage.setItem('_sessionSeed', JSON.stringify({
          selectedQuestions: processedQuestions,
          timestamp: Date.now()
        }));
      }
    } catch (err) {
      console.error('Error preparing quiz data:', err);
      setError('Failed to prepare quiz');
    }
  }, [debugEnabled]);

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
          console.log(`[QuizPage] Using session prefetched quiz for ${moduleSlug}`);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error(`[QuizPage] Error checking prefetched quiz for ${moduleSlug}:`, error);
      return false;
    }
  }, []);

  useEffect(() => {
    async function initializePage() {
      try {
        const resolvedParams = await params;
        const slug = resolvedParams.shortSlug;
        console.log('=== Quiz Page Debug ===');
        console.log('Short slug:', slug);

        const moduleData = await contentRegistry.getModule(slug);
        console.log('Module data:', moduleData);
        if (!moduleData) {
          setError('Module not found');
          return;
        }
        setCurrentModule(moduleData);

        // Check if quiz is prefetched before loading
        const isPrefetched = await checkPrefetchedQuiz(moduleData.slug);
        console.log(`Quiz for ${moduleData.slug} is ${isPrefetched ? 'prefetched' : 'not prefetched'}`);

        const moduleQuiz = await contentRegistry.getModuleQuiz(moduleData.slug);
        console.log('Module quiz:', moduleQuiz);
        setQuiz(moduleQuiz);

        const moduleThresholds = await contentRegistry.checkModuleThresholds(moduleData.slug);
        console.log('Module thresholds:', moduleThresholds);
        setThresholds(moduleThresholds);

        if (!moduleThresholds.quizValid && process.env.NODE_ENV === 'production') {
          setError('Quiz not available');
          return;
        }

        const allModules = await contentRegistry.getModules();
        const unlocking = allModules
          .filter(m => (m.prerequisites || []).includes(moduleData.slug))
          .map(m => ({ slug: m.slug, title: m.title, routes: { overview: m.routes.overview } }));
        setUnlockingModules(unlocking);

        // Initialize quiz data
        await initializeQuizData(moduleData, moduleQuiz, moduleThresholds);
      } catch (err) {
        console.error('Error initializing quiz page:', err);
        setError('Failed to load quiz data');
      } finally {
        setLoading(false);
      }
    }

    initializePage();
  }, [params, initializeQuizData, checkPrefetchedQuiz]);

  // Check prefetch status periodically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Import the quizPrefetchService dynamically
      import('@/lib/quizPrefetchService').then(({ quizPrefetchService }) => {
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
    setDebugEnabled(localStorage.getItem('debug') === 'true');
  }, []);

  const handleStartQuiz = async () => {
    if (!quizData?._sessionSeed?.selectedQuestions || !currentModule) {
      console.error('Quiz data not ready');
      return;
    }

    try {
      const selectedQuestions = quizData._sessionSeed.selectedQuestions;
      const sessionPayload: QuizSession = {
        questions: selectedQuestions,
        totalQuestions: quizData.totalQuestions,
        passingScore: quizData.passingScore,
        timeLimit: quizData.timeLimit,
        startedAt: Date.now(),
        answers: new Array(quizData.totalQuestions).fill(null)
      };

      // Store session in sessionStorage
      const sessionKey = `quizSession:${currentModule.slug}`;
      sessionStorage.setItem(sessionKey, JSON.stringify(sessionPayload));

      // Update localStorage history
      const historyKey = `quiz_history_${currentModule.slug}`;
      const historyData = localStorage.getItem(historyKey);
      const currentHistory = historyData ? JSON.parse(historyData) : [];
      const newQuestionIds = selectedQuestions.map((q: ProgrammingQuestion) => q.id);
      const updatedHistory = [...newQuestionIds, ...currentHistory].slice(0, 200);
      localStorage.setItem(historyKey, JSON.stringify(updatedHistory));

      // Navigate to first question
      router.push(`/${currentModule.slug}/quiz/question/1`);
    } catch (err) {
      console.error('Error starting quiz:', err);
      setError('Failed to start quiz');
    }
  };

  if (loading) {
    return (
      <LoadingScreen message="Loading quiz..." prefetchStatus={prefetchStatus} />
    );
  }

  if (error || !currentModule) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            {error || 'Module not found'}
          </h2>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
  const quizLength = currentModule.metadata?.thresholds?.minQuizQuestions ?? currentModule.thresholds?.requiredQuestions ?? 14;

  return (
    <QuizLayout module={currentModule} quiz={quiz} thresholds={layoutThresholds} unlockingModules={unlockingModules}>
      {/* Prefetch Status Indicator */}
      {prefetchStatus && prefetchStatus.isPrefetching && (
        <div className="mb-6 glass-morphism p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Background quiz prefetching in progress
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300">
                {prefetchStatus.prefetchedCount} quizzes loaded
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Content */}
      {quiz && quiz.questions && quiz.questions.length > 0 && quizData ? (
        <div className="space-y-8">
          {/* Assessment Overview */}
          <div className="glass-morphism px-8 py-8 rounded-xl">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              🎯 Assessment Overview
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You will answer {quizLength} randomly selected questions covering key concepts from the {currentModule.title} module.
              Questions are chosen from a larger pool to keep each attempt fresh.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Quiz Length combined with pool size */}
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                  {quizData.totalQuestions} <span className="text-sm font-medium text-blue-700 dark:text-blue-200">questions</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  Pool: {poolCount}
                </div>
              </div>
              {/* Requirement Met */}
              <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-300">
                  {reqPercent}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Requirement Met
                </div>
              </div>
              {/* Time Limit */}
              <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-300">
                  {quizData.timeLimit} min
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Time Limit
                </div>
              </div>
              {/* Passing Score */}
              <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                  {quizData.passingScore}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Passing Score
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm">
                Multiple Choice
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm">
                True/False
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-sm">
                Scenario-Based
              </span>
            </div>

            {unlockingModules && unlockingModules.length > 0 && (
              <div className="mb-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Unlocks on completion</h3>
                <div className="flex flex-wrap gap-2">
                  {unlockingModules.map((m) => (
                    <Link key={m.slug} href={m.routes.overview} className="unlock-chip">
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

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              📋 Quiz Instructions
            </h2>
            
            <ul className="space-y-4 mb-8">
              {quizData.instructions.map((instruction: string, index: number) => (
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

            <div className="flex justify-center">
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
      ) : (
        <div className="glass-morphism p-12 rounded-xl text-center">
          <div className="text-6xl mb-4">❓</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Quiz Questions Not Available Yet
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Quiz questions for this module are currently being prepared. Check back soon!
          </p>
          <Link
            href={currentModule.routes.overview}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Module
          </Link>
        </div>
      )}

      {/* Navigation Footer */}
      <footer className="mt-12 flex justify-between items-center">
        <Link
          href={currentModule.routes.overview}
          className="inline-flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Back to Module Overview
        </Link>
        
        {thresholds?.lessonsValid && (
          <Link
            href={currentModule.routes.lessons}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Review Lessons
            <span className="ml-2">📚</span>
          </Link>
        )}
      </footer>
    </QuizLayout>
  );
}