"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useNextUnlockedLesson } from "@/hooks/useNextUnlockedLesson";
import { useRouter } from "next/navigation";
import { useQuery, gql, useMutation } from '@apollo/client';
import TechnologyUtilizationBox from '../../../components/TechnologyUtilizationBox';
import EnhancedLoadingComponent from '../../../components/EnhancedLoadingComponent';
import ConfettiBurst from '../../../components/ConfettiBurst';

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

function CircularProgress({ percent }: { percent: number }) {
  const radius = 32;
  const stroke = 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  return (
    <svg height={radius * 2} width={radius * 2} className="block mx-auto">
      <circle
        stroke="#e5e7eb"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke="#3b82f6"
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference + " " + circumference}
        style={{ strokeDashoffset, transition: "stroke-dashoffset 0.5s" }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy="0.3em"
        fontSize="1.1em"
        fill="#3b82f6"
        fontWeight="bold"
      >
        {Math.round(percent)}%
      </text>
    </svg>
  );
}

export default function ProgrammingInterviewPage() {
  // Compute build phase flag without affecting hook execution order
  const isBuildPhase = typeof process !== 'undefined' && process.env.NEXT_PHASE === 'phase-production-build';
  const { nextLessonHref } = useNextUnlockedLesson();

  const [shuffledQuestions, setShuffledQuestions] = useState<ProgrammingInterviewQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [shuffled, setShuffled] = useState(false);
  const router = useRouter();
  const retryCountRef = useRef(0);

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
    setLoading(true);
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
  
  const passed = score >= Math.ceil(shuffledQuestions.length * 0.7);

  if (current >= shuffledQuestions.length)
    return (
      // Updated container with glass morphism effect
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        {/* Confetti celebration when passed */}
        <ConfettiBurst active={passed} durationMs={5000} />
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4">
              Quiz Completed
            </h2>
            
            <div className="mb-6">
              <CircularProgress percent={Math.round((score / shuffledQuestions.length) * 100)} />
              <p className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-200">
                Score: {score}/{shuffledQuestions.length} ({Math.round((score / shuffledQuestions.length) * 100)}%)
              </p>
              <p className="mt-1 text-gray-600 dark:text-gray-300">
                {score >= Math.ceil(shuffledQuestions.length * 0.7) 
                  ? 'Great job! You have successfully passed the Programming interview quiz.' 
                  : 'You need to score at least 70% to pass. Keep learning and try again!'}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link href="/" className="btn btn-secondary">
                Return Home
              </Link>
              {score < Math.ceil(shuffledQuestions.length * 0.7) && (
                <Link href="/programming/lessons" className="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-lg hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-150 font-semibold">
                  Review Lessons
                </Link>
              )}
              {passed && (
                <Link
                  href={nextLessonHref || "/modules/programming-fundamentals/lessons/1"}
                  className="btn btn-success font-semibold"
                  aria-label="Start Next Lesson"
                >
                  Start Next Lesson
                </Link>
              )}
              <button
                onClick={restartQuiz}
                className="btn btn-primary"
              >
                Try Again
              </button>
            </div>

            {passed && (
              <div className="mt-10 relative mx-auto max-w-2xl">
                <div className="relative rounded-2xl p-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950/40 dark:via-gray-900 dark:to-indigo-900/40 border-4 border-blue-200 dark:border-blue-700 shadow-xl">
                  {/* Decorative corner flourishes */}
                  <div className="absolute -top-3 -left-3 h-12 w-12 rounded-full border-4 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-900" />
                  <div className="absolute -top-3 -right-3 h-12 w-12 rounded-full border-4 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-900" />
                  <div className="absolute -bottom-3 -left-3 h-12 w-12 rounded-full border-4 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-900" />
                  <div className="absolute -bottom-3 -right-3 h-12 w-12 rounded-full border-4 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-900" />

                  {/* Title */}
                  <h3 className="text-2xl font-extrabold tracking-wide text-blue-800 dark:text-blue-200 mb-3">Certificate of Achievement</h3>
                  <p className="text-sm uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-6">Presented by GlassCode Academy</p>

                  {/* Recipient and details */}
                  <div className="space-y-2">
                    <p className="text-gray-800 dark:text-gray-200 text-lg">This certifies that</p>
                    <p className="text-2xl font-semibold text-blue-700 dark:text-blue-300">You</p>
                    <p className="text-gray-700 dark:text-gray-300">successfully completed the Programming Interview Preparation Quiz</p>
                    <p className="text-gray-700 dark:text-gray-300">with a score of <span className="font-semibold">{score}/{shuffledQuestions.length}</span> ({Math.round((score / shuffledQuestions.length) * 100)}%).</p>
                  </div>

                  {/* Seal */}
                  <div className="mt-8 flex items-center justify-center gap-6">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 dark:from-yellow-500 dark:to-amber-600 shadow-lg border-4 border-yellow-200 dark:border-amber-700 flex items-center justify-center">
                      <span className="text-white font-bold">PASS</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Issued on {new Date().toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Certificate ID: {Math.floor(Math.random() * 1_000_000)}</p>
                    </div>
                  </div>

                  {/* Signature line */}
                  <div className="mt-8 border-t border-dashed border-gray-300 dark:border-gray-700 pt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Authorized by GlassCode Academy</p>
                  </div>
                </div>
              </div>
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
  
  // Get the correct answer index in the display order
  const getDisplayCorrectAnswerIndex = () => {
    if (q.correctAnswer === undefined) return -1;
    if (!q.choiceOrder) return q.correctAnswer;
    
    // Find where the original correct answer is in the shuffled order
    return q.choiceOrder.indexOf(q.correctAnswer);
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
        <fieldset role="radiogroup" aria-label="Answer choices" className="space-y-3">
                <legend className="sr-only">Choose an answer</legend>
                {getDisplayChoices().map((choice, displayIndex) => {
                  const isSelected = selected === displayIndex;
                  const isCorrect = !!feedback && displayIndex === getDisplayCorrectAnswerIndex();
                  const isIncorrectSelected = !!feedback && isSelected && !isCorrect;
                  return (
                    <label
                      key={displayIndex}
                      className={`group relative p-4 border rounded-lg cursor-pointer transition-colors duration-150 focus-within:ring-2 focus-within:ring-blue-500 ${
                        feedback
                          ? isCorrect
                            ? "bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-600"
                            : isIncorrectSelected
                              ? "bg-red-50 dark:bg-red-900/30 border-red-400 dark:border-red-600"
                              : "border-gray-300 dark:border-gray-600"
                          : isSelected
                            ? "bg-white dark:bg-gray-800 border-blue-500 ring-1 ring-blue-400"
                            : "border-gray-300 hover:border-blue-400 dark:border-gray-600 dark:hover:border-blue-500"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value={displayIndex}
                        checked={isSelected}
                        onChange={() => !feedback && setSelected(displayIndex)}
                        disabled={!!feedback}
                        className="sr-only"
                      />
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 h-5 w-5 border rounded-full mt-0.5 mr-3 flex items-center justify-center transition-colors duration-150 ${
                          feedback
                            ? isCorrect
                              ? "bg-green-500 border-green-500 text-white"
                              : isIncorrectSelected
                                ? "bg-red-500 border-red-500 text-white"
                                : "border-gray-300 dark:border-gray-500"
                          : isSelected
                            ? "bg-blue-500 border-blue-500"
                            : "border-gray-300 dark:border-gray-500"
                        }`}>
                          {(feedback && isCorrect) && (
                            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {(feedback && isIncorrectSelected) && (
                            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: formatQuestionText(choice) }}></span>
                      </div>
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
    </div>
  );
}