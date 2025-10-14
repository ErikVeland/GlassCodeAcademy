"use client";

 import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useNextUnlockedLesson } from "@/hooks/useNextUnlockedLesson";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, gql, useMutation } from '@apollo/client';
import TechnologyUtilizationBox from '../../../components/TechnologyUtilizationBox';
import EnhancedLoadingComponent from '../../../components/EnhancedLoadingComponent';
import ConfettiBurst from '../../../components/ConfettiBurst';
import QuizResult from '../../../components/QuizResult';
import { useProgressTracking } from "@/hooks/useProgressTracking";
import { useProgressTrackingComplete } from "@/hooks/useProgressTrackingComplete";

interface ProgrammingInterviewQuestion {
  id: number;
  topic: string;
  type: string;
  question: string;
  choices?: string[];
  correctAnswer?: number;
  explanation?: string;
  choiceOrder?: number[]; // Track the order of choices after shuffling
}

interface AnswerResult {
  isCorrect: boolean;
  explanation?: string;
}

const PROGRAMMING_QUIZ_STORAGE_KEY = "programming_quiz_state_v1";

const PROGRAMMING_INTERVIEW_QUESTIONS_QUERY = gql`
  query ProgrammingInterviewQuestions {
    programmingInterviewQuestions {
      id
      topic
      type
      question
      choices
      correctAnswer
      explanation
    }
  }
`;

const SUBMIT_PROGRAMMING_ANSWER_MUTATION = gql`
  mutation SubmitProgrammingAnswer($questionId: Int!, $answerIndex: Int!) {
    submitProgrammingAnswer(questionId: $questionId, answerIndex: $answerIndex) {
      isCorrect
      explanation
    }
}
`;

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatQuestionText(text: string) {
  // Escape HTML first to prevent injection
  let escaped = escapeHtml(text);

  // Store code segment placeholders to avoid interfering with keyword highlighting
  const placeholders: Record<string, string> = {};
  let counter = 0;

  // Handle fenced code blocks: ```lang\n...```
  escaped = escaped.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
    const id = `__CODEBLOCK_${counter++}__`;
    const languageClass = lang ? `language-${lang}` : '';
    const html = `<pre class="bg-gray-900 text-gray-100 dark:bg-gray-900 rounded-md p-3 overflow-x-auto text-sm"><code class="font-mono ${languageClass}">${code}</code></pre>`;
    placeholders[id] = html;
    return id;
  });

  // Handle inline code: `code`
  escaped = escaped.replace(/`([^`]+)`/g, (_match, code) => {
    const id = `__INLINECODE_${counter++}__`;
    const html = `<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">${code}</code>`;
    placeholders[id] = html;
    return id;
  });

  // Optional: highlight common CS terms outside of code segments
  escaped = escaped.replace(/\b(Variables|Data Types|Control Structures|Functions|Arrays|Objects|Loops|Conditionals|Scope|Recursion|Algorithms|Data Structures|Big O|Time Complexity|Space Complexity)\b/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>');

  // Restore placeholders
  Object.keys(placeholders).forEach((id) => {
    escaped = escaped.replace(id, placeholders[id]);
  });

  return escaped;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Update the shuffle function to track choice order
function shuffleQuestionChoices(question: ProgrammingInterviewQuestion): ProgrammingInterviewQuestion {
  // If no choices or only one choice, return as is
  if (!question.choices || question.choices.length <= 1) {
    return question;
  }
  
  // Create an array of indices and shuffle them
  const indices = question.choices.map((_, index) => index);
  const shuffledIndices = shuffle(indices);
  
  return {
    ...question,
    choiceOrder: shuffledIndices
  };
}

// Using shared CircularProgress via QuizResult component

function ProgrammingInterviewContent() {
  // Compute build phase flag without affecting hook execution order
  const isBuildPhase = typeof process !== 'undefined' && process.env.NEXT_PHASE === 'phase-production-build';
  const searchParams = useSearchParams();
  const isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
  const autopass = isDev && searchParams?.get('autopass') === '1';
  const debugMode = isDev && searchParams?.get('debug') === '1';
  const { nextLessonHref } = useNextUnlockedLesson();
  const { updateProgress: updateDefaultProgress } = useProgressTracking();
  const { updateProgress: updateCompleteProgress } = useProgressTrackingComplete();

  const [shuffledQuestions, setShuffledQuestions] = useState<ProgrammingInterviewQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [shuffled, setShuffled] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{ defaultProgress?: unknown; completeProgress?: unknown; achievements?: unknown; streak?: unknown } | null>(null);
  const router = useRouter();
  const retryCountRef = useRef(0);
  const hasUpdatedProgressRef = useRef(false);

  const { data, loading: gqlLoading, error: gqlError, refetch } = useQuery(PROGRAMMING_INTERVIEW_QUESTIONS_QUERY);
  
  // Reset retry count on successful load
  useEffect(() => {
    if (data && !gqlLoading) {
      retryCountRef.current = 0;
    }
  }, [data, gqlLoading]);

  // Increment retry counter for network errors via derived state
  useEffect(() => {
    if (gqlError && isNetworkError(gqlError)) {
      retryCountRef.current += 1;
    }
  }, [gqlError]);

  const gqlQuestions: ProgrammingInterviewQuestion[] = data?.programmingInterviewQuestions ?? [];

  const [submitAnswer] = useMutation(SUBMIT_PROGRAMMING_ANSWER_MUTATION);

  useEffect(() => {
    const saved = localStorage.getItem(PROGRAMMING_QUIZ_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setShuffledQuestions(parsed.questions || []);
        setCurrent(parsed.current || 0);
        setSelected(parsed.selected ?? null);
        setScore(parsed.score || 0);
        setShuffled(true);
        setLoading(false);
        return;
      } catch {}
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (gqlQuestions.length > 0 && !shuffled) {
      // Select 20 random questions from the pool
      const selectedQuestions = shuffle(gqlQuestions).slice(0, 20);
      // Shuffle both questions and choices within each question
      const shuffledQs = selectedQuestions.map(q => shuffleQuestionChoices(q));
      setShuffledQuestions(shuffledQs);
      setShuffled(true);
    }
  }, [gqlQuestions, shuffled]);

  useEffect(() => {
    if (shuffledQuestions.length === 0) return;
    localStorage.setItem(
      PROGRAMMING_QUIZ_STORAGE_KEY,
      JSON.stringify({ questions: shuffledQuestions, current, selected, score })
    );
  }, [shuffledQuestions, current, selected, score]);

  // Dev-only: Autopass support via query flag to speed up verification
  useEffect(() => {
    if (!autopass) return;
    if (shuffledQuestions.length > 0 && current < shuffledQuestions.length) {
      const total = shuffledQuestions.length;
      setSelected(null);
      setFeedback({ isCorrect: true, explanation: 'Auto-pass mode' });
      setScore(total);
      setCurrent(total);
    }
  }, [autopass, shuffledQuestions.length, current]);

  // Optional debug panel: expose localStorage progress values for quick validation
  useEffect(() => {
    if (!debugMode) return;
    try {
      const defaultProgressRaw = localStorage.getItem('fullstack_progress_veland');
      const completeProgressRaw = localStorage.getItem('dotnetquiz_progress_complete');
      const achievementsRaw = localStorage.getItem('dotnetquiz_achievements_complete');
      const streakRaw = localStorage.getItem('dotnetquiz_streak_complete');
      setDebugInfo({
        defaultProgress: defaultProgressRaw ? JSON.parse(defaultProgressRaw) : null,
        completeProgress: completeProgressRaw ? JSON.parse(completeProgressRaw) : null,
        achievements: achievementsRaw ? JSON.parse(achievementsRaw) : null,
        streak: streakRaw ? JSON.parse(streakRaw) : null,
      });
    } catch {
      // ignore JSON parse errors in debug mode
    }
  }, [debugMode, current]);

  // Derived pass flag based on current score and total questions
  const passed = score >= Math.ceil(shuffledQuestions.length * 0.7);

  // Update progress when quiz is completed and passed; ensure stable hook order
  // and guard against zero-question edge cases.
  useEffect(() => {
    if (shuffledQuestions.length === 0) return;
    const quizFinished = current >= shuffledQuestions.length;
    if (quizFinished && passed && !hasUpdatedProgressRef.current) {
      const percentScore = Math.round((score / shuffledQuestions.length) * 100);
      try {
        // Update default progress store used by navigation/locks
        updateDefaultProgress('programming-fundamentals', { quizScore: percentScore });
        // Update complete progress store with certificate metadata
        updateCompleteProgress('programming-fundamentals', {
          quizScore: percentScore,
          certificate: {
            earned: true,
            earnedDate: new Date().toISOString(),
            shareUrl: ''
          }
        });
      } finally {
        hasUpdatedProgressRef.current = true;
      }
    }
  }, [current, shuffledQuestions.length, passed, score, updateDefaultProgress, updateCompleteProgress]);

  const handleSubmit = async () => {
    if (selected === null) return;
    setFeedback(null);
    
    // Map the selected display index back to the original index
    let originalSelectedIndex = selected;
    const currentQuestion = shuffledQuestions[current];
    if (currentQuestion.choiceOrder && currentQuestion.correctAnswer !== undefined) {
      // The selected index is the display index, we need the original index
      originalSelectedIndex = currentQuestion.choiceOrder[selected];
    }
    
    // Use Apollo mutation instead of REST
    const { data } = await submitAnswer({
      variables: { questionId: currentQuestion.id, answerIndex: originalSelectedIndex },
      optimisticResponse: {
        submitProgrammingAnswer: {
          isCorrect: false, // Optimistic default
          explanation: 'Checking...',
          __typename: 'AnswerResult',
        },
      },
    });
    setFeedback(data.submitProgrammingAnswer);
    if (data.submitProgrammingAnswer.isCorrect) setScore((s) => s + 1);
  };

  const nextQuestion = () => {
    setSelected(null);
    setFeedback(null);
    setCurrent((c) => c + 1);
  };

  const clearQuizState = () => {
    localStorage.removeItem(PROGRAMMING_QUIZ_STORAGE_KEY);
  };

  const restartQuiz = () => {
    clearQuizState();
    setCurrent(0);
    setSelected(null);
    setFeedback(null);
    setScore(0);
    setShuffled(false);
    retryCountRef.current = 0;
    refetch();
  };

  // Helper function to determine if an error is a network error
  // Type-safe helpers to avoid using `any` and handle diverse error shapes
  const hasMessage = (e: unknown): e is { message: string } => {
    return typeof e === 'object' && e !== null && typeof (e as Record<string, unknown>).message === 'string';
  };
  const hasNetworkError = (e: unknown): e is { networkError: unknown } => {
    return typeof e === 'object' && e !== null && (e as Record<string, unknown>).networkError !== undefined;
  };
  const isNetworkError = (error: unknown): boolean => {
    if (!error) return false;
    const message = hasMessage(error) ? error.message : '';
    const networkError = hasNetworkError(error) ? (error as Record<string, unknown>).networkError : undefined;
    return !!(
      message?.includes('Failed to fetch') ||
      message?.includes('NetworkError') ||
      message?.includes('ECONNREFUSED') ||
      message?.includes('timeout') ||
      message?.includes('502') || // Bad Gateway
      message?.includes('503') || // Service Unavailable
      message?.includes('504') || // Gateway Timeout
      networkError
    );
  };

  // Show enhanced loading during initial load, retries, or build phase
  if (gqlLoading || loading || retryCountRef.current > 0 || isBuildPhase) {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <EnhancedLoadingComponent 
            retryCount={retryCountRef.current} 
            maxRetries={30} 
            error={gqlError}
            onRetry={() => {
              retryCountRef.current = 0;
              refetch();
            }}
          />
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              We&apos;re automatically retrying while the backend starts up.
              If this takes too long, you can manually retry using the button above.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (gqlError && !isNetworkError(gqlError)) {
    return (
      // Updated container with glass morphism effect
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h2>
            <p className="mb-4 text-gray-800 dark:text-gray-200">Failed to load questions. Please try again.</p>
            <button
              onClick={() => {
                retryCountRef.current = 0;
                refetch();
              }}
              className="btn btn-danger"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!shuffledQuestions.length) {
    return (
      // Updated container with glass morphism effect
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">No Questions Available</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-300">There are no Programming interview questions available at this time.</p>
            <Link href="/" className="btn btn-danger">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  

  if (current >= shuffledQuestions.length)
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <QuizResult
            moduleName="Programming"
            score={score}
            total={shuffledQuestions.length}
            onRetry={restartQuiz}
            nextLessonHref={nextLessonHref || "/modules/programming-fundamentals/lessons/1"}
            passThresholdPercent={70}
          />
          <div className="mt-8 flex justify-center">
            <Link href="/" className="btn btn-secondary">
              Return Home
            </Link>
            {score < Math.ceil(shuffledQuestions.length * 0.7) && (
              <Link href="/modules/programming-fundamentals/lessons" className="ml-4 px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-lg hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-150 font-semibold">
                Review Lessons
              </Link>
            )}
          </div>
        </div>
      </div>
    );

  const q = shuffledQuestions[current];
  const progress = ((current + 1) / shuffledQuestions.length) * 100;

  // Get the choices in the correct display order
  const getDisplayChoices = () => {
    if (!q.choices) return [];
    if (!q.choiceOrder) return q.choices;
    
    // Return choices in the shuffled order
    return q.choiceOrder.map(index => q.choices![index]);
  };

  return (
    // Updated container with glass morphism effect
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Progress bar */}
        <div className="bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm h-2">
          <div 
            className="bg-blue-600 dark:bg-blue-500 h-2 transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Question {current + 1} of {shuffledQuestions.length}</span>
              <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400">{q.topic}</h3>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Score</span>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{score}/{current}</p>
            </div>
          </div>
          
          {/* Question */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              <span dangerouslySetInnerHTML={{ __html: formatQuestionText(q.question) }}></span>
            </h2>
            
            {/* Multiple choice */}
            {q.type === 'multiple-choice' && q.choices && (
              <fieldset role="radiogroup" aria-label="Answer choices" className="space-y-2">
                <legend className="sr-only">Choose an answer</legend>
                {getDisplayChoices().map((choice, displayIndex) => {
                  const isSelected = selected === displayIndex;
                  return (
                    <label
                      key={displayIndex}
                      className="flex items-start gap-3 p-3 rounded cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value={displayIndex}
                        checked={isSelected}
                        onChange={() => !feedback && setSelected(displayIndex)}
                        disabled={!!feedback}
                        className="mt-1"
                      />
                      <span
                        className="text-gray-800 dark:text-gray-200 leading-tight"
                        dangerouslySetInnerHTML={{ __html: formatQuestionText(choice) }}
                      ></span>
                    </label>
                  );
                })}
              </fieldset>
            )}
            
            {/* Open-ended */}
            {q.type === 'open-ended' && (
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50/80 dark:bg-gray-700/80 backdrop-blur-sm">
                <p className="text-gray-600 dark:text-gray-300 italic mb-2">This is an open-ended question. Think about your answer, then click &quot;Show Answer&quot; to see the explanation.</p>
                {feedback ? (
                  <div className="bg-green-50/80 dark:bg-green-900/40 border border-green-200 dark:border-green-700 rounded p-3 backdrop-blur-sm">
                    <p className="font-medium text-green-800 dark:text-green-200">Explanation:</p>
                    <p className="text-green-700 dark:text-green-300">{q.explanation}</p>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      setFeedback({ isCorrect: true, explanation: q.explanation });
                    }}
                    className="btn btn-primary mt-2"
                  >
                    Show Answer
                  </button>
                )}
              </div>
            )}
          </div>
          {/* Live region for feedback announcements */}
          <div aria-live="polite" className="sr-only">
            {feedback ? `${feedback.isCorrect ? 'Correct' : 'Incorrect'}. ${feedback.explanation ?? ''}` : ''}
          </div>
          
          {/* Feedback */}
          {feedback && q.type === 'multiple-choice' && (
            <div className={`mb-6 p-4 rounded-lg border backdrop-blur-sm ${
              feedback.isCorrect 
                ? 'bg-green-50/80 dark:bg-green-900/40 border-green-200 dark:border-green-700' 
                : 'bg-red-50/80 dark:bg-red-900/40 border-red-200 dark:border-red-700'
            }`}>
              <p className={`font-medium ${
                feedback.isCorrect 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
              </p>
              {feedback.explanation && (
                <div className="mt-2">
                  <p className="font-medium text-gray-800 dark:text-gray-200">Explanation:</p>
                  <p className={
                    feedback.isCorrect 
                      ? 'text-green-700 dark:text-green-300' 
                      : 'text-red-700 dark:text-red-300'
                  }>{feedback.explanation}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-between">
            <button
              onClick={() => { clearQuizState(); router.push('/'); }}
              className="btn btn-secondary"
            >
              Exit Quiz
            </button>
            
            <div>
              {q.type === 'multiple-choice' && !feedback && (
                <button
                  onClick={handleSubmit}
                  disabled={selected === null}
                  className="btn btn-primary"
                >
                  Submit
                </button>
              )}
              
              {feedback && (
                <button
                  onClick={nextQuestion}
                  className={current === shuffledQuestions.length - 1 ? 'btn btn-success' : 'btn btn-primary'}
                >
                  {current === shuffledQuestions.length - 1 ? 'Finish Quiz 🎉' : 'Next Question'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <TechnologyUtilizationBox 
        technology="Programming Fundamentals" 
        explanation="In this Programming Fundamentals module, core programming concepts are taught using fundamental programming constructs and logic." 
      />

      {debugMode && (
        <div className="mt-6 p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Debug Panel</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">LocalStorage progress snapshots:</p>
          <pre className="text-xs overflow-auto max-h-64 bg-gray-50 dark:bg-gray-900/50 p-3 rounded">
{JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function ProgrammingInterviewPage() {
  return (
    <Suspense fallback={
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Loading Interview</h2>
              <p className="mb-4 text-gray-600 dark:text-gray-300">Preparing questions and settings...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <ProgrammingInterviewContent />
    </Suspense>
  );
}
