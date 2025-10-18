'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { contentRegistry, type Module, type Quiz, type ProgrammingQuestion } from '@/lib/contentRegistry';
import QuizLayout from '@/components/QuizLayout';

interface QuizPageProps {
  params: Promise<{ moduleSlug: string }>;
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
  answers: unknown[];
}

export default function QuizPage({ params }: QuizPageProps) {
  const router = useRouter();
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
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

  const debugEnabled = process.env.NODE_ENV === 'development';

  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params;
      
      try {
        const moduleData = await contentRegistry.getModule(resolvedParams.moduleSlug);
        if (!moduleData) {
          setError('Module not found');
          return;
        }
        setCurrentModule(moduleData);

        const moduleQuiz = await contentRegistry.getModuleQuiz(moduleData.slug);
        setQuiz(moduleQuiz);

        const moduleThresholds = await contentRegistry.checkModuleThresholds(moduleData.slug);
        setThresholds(moduleThresholds);

        if (!moduleThresholds.quizValid && process.env.NODE_ENV === 'production') {
          setError('Quiz not available');
          return;
        }

        // Get unlocking modules
        const allModules = await contentRegistry.getModules();
        const unlocking = allModules
          .filter(m => (m.prerequisites || []).includes(moduleData.slug))
          .map(m => ({ slug: m.slug, title: m.title, routes: { overview: m.routes.overview } }));
        setUnlockingModules(unlocking);

        // Initialize quiz data
        await initializeQuizData(moduleData, moduleQuiz, moduleThresholds);
      } catch (err) {
        console.error('Error initializing quiz page:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    resolveParams();
  }, []);

  async function initializeQuizData(
    moduleData: Module,
    moduleQuiz: Quiz | null,
    moduleThresholds: { lessons?: boolean; quiz?: boolean } | null
  ) {
    if (!moduleQuiz?.questions || moduleQuiz.questions.length === 0) {
      return;
    }

    try {
      const targetQuestions = moduleData.metadata?.thresholds?.minQuizQuestions ?? moduleData.thresholds?.requiredQuestions ?? 14;
      const allQuestions = moduleQuiz.questions;
      setPoolCount(allQuestions.length);

      // Get history from localStorage to avoid recently used questions
      const historyKey = `quiz_history_${moduleData.slug}`;
      const historyData = localStorage.getItem(historyKey);
      const recentQuestionIds = historyData ? JSON.parse(historyData) : [];

      // Filter out recently used questions
      const availableQuestions = allQuestions.filter((q: ProgrammingQuestion) => q.id && !recentQuestionIds.includes(q.id));
      const questionsToUse = availableQuestions.length >= targetQuestions ? availableQuestions : allQuestions;

      // Shuffle and select questions
      const shuffled = [...questionsToUse].sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, targetQuestions);

      // Randomize choice order for multiple choice questions
      const processedQuestions = selectedQuestions.map(q => {
        if (q.type === 'multiple-choice' && q.choices && !q.fixedChoiceOrder) {
          const shuffledChoices = [...q.choices].sort(() => Math.random() - 0.5);
          return { ...q, choices: shuffledChoices };
        }
        return q;
      });
      if (debugEnabled) {
        console.log('Selected IDs:', processedQuestions.map(q => q.id));
        console.log('Pool size:', allQuestions.length);
      }

      // Calculate time limit and passing score
      const timeLimit = Math.min(Math.max(Math.ceil(targetQuestions * 1.5), 10), 45);
      const passingScore = moduleData.metadata?.thresholds?.passingScore || 70;

      // Calculate requirement percentage
      const reqPercent = ((moduleThresholds?.lessons ? 50 : 0) + (moduleThresholds?.quiz ? 50 : 0));
      setReqPercent(reqPercent);

      const quizOverview: QuizData = {
        title: `${moduleData.title} Assessment`,
        totalQuestions: targetQuestions,
        timeLimit,
        passingScore,
        instructions: [
          `You will answer ${targetQuestions} questions covering key concepts from the ${moduleData.title} module.`,
          'Questions are randomly selected from a larger pool to keep each attempt fresh.',
          'Read each question carefully before selecting your answer.',
          'You can change your answers before submitting.',
          'The quiz timer will start when you click "Start Quiz" and cannot be paused.',
          'You must achieve at least ' + passingScore + '% to pass this assessment.'
        ],
        _sessionSeed: {
          selectedQuestions: processedQuestions
        }
      };

      // Store session seed for debugging
      if (debugEnabled) {
        sessionStorage.setItem('_sessionSeed', JSON.stringify({
          selectedQuestions: processedQuestions.map(q => ({ id: q.id, question: q.question?.substring(0, 50) + '...' }))
        }));
      }

      setQuizData(quizOverview);
    } catch (err) {
      console.error('Error initializing quiz data:', err);
      setError('Failed to initialize quiz');
    }
  }

  async function handleStartQuiz() {
    if (!quizData?._sessionSeed?.selectedQuestions || !currentModule) {
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
        answers: new Array(selectedQuestions.length).fill(null)
      };

      // Store session in sessionStorage
      const sessionKey = `quizSession:${currentModule.slug}`;
      sessionStorage.setItem(sessionKey, JSON.stringify(sessionPayload));

      // Update localStorage history
      const historyKey = `quiz_history_${currentModule.slug}`;
      const historyData = localStorage.getItem(historyKey);
      const currentHistory = historyData ? JSON.parse(historyData) : [];
      const newQuestionIds = selectedQuestions.map((q: ProgrammingQuestion) => q.id).filter(id => id !== undefined);
      const updatedHistory = [...newQuestionIds, ...currentHistory].slice(0, 200);
      localStorage.setItem(historyKey, JSON.stringify(updatedHistory));

      // Navigate to first question
      router.push(`/modules/${currentModule.slug}/quiz/question/1`);
    } catch (err) {
      console.error('Error starting quiz:', err);
      setError('Failed to start quiz');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Error</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <Link
            href="/modules"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Modules
          </Link>
        </div>
      </div>
    );
  }

  if (!currentModule || !quiz || !thresholds) {
    return null;
  }

  const layoutThresholds = {
    requiredQuestions: currentModule.thresholds?.requiredQuestions,
    passingScore: currentModule.metadata?.thresholds?.passingScore || 70,
  };

  return (
    <QuizLayout module={currentModule} quiz={quiz} thresholds={layoutThresholds} unlockingModules={unlockingModules}>
      {/* Quiz Content */}
      {quiz && quiz.questions && quiz.questions.length > 0 && quizData ? (
        <div className="space-y-8">
          {/* Assessment Overview */}
          <div className="glass-morphism px-8 py-8 rounded-xl">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              🎯 Assessment Overview
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You will answer {quizData.totalQuestions} randomly selected questions covering key concepts from the {currentModule.title} module.
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