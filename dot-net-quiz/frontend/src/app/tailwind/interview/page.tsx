"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, gql, useMutation } from '@apollo/client';
import TechnologyUtilizationBox from '../../../components/TechnologyUtilizationBox';
import EnhancedLoadingComponent from '../../../components/EnhancedLoadingComponent';

interface TailwindInterviewQuestion {
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

const TAILWIND_QUIZ_STORAGE_KEY = "tailwind_quiz_state_v1";

const TAILWIND_INTERVIEW_QUESTIONS_QUERY = gql`
  query TailwindInterviewQuestions {
    tailwindInterviewQuestions {
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

const SUBMIT_TAILWIND_ANSWER_MUTATION = gql`
  mutation SubmitTailwindAnswer($questionId: Int!, $answerIndex: Int!) {
    submitTailwindAnswer(questionId: $questionId, answerIndex: $answerIndex) {
      isCorrect
      explanation
    }
  }
`;

function formatQuestionText(text: string) {
  return text.replace(/\b(tailwind|flex|grid|container|mx|my|px|py|w-|h-|bg-|text-|border-|rounded-|shadow-|hover:|focus:|md:|lg:|xl:|sm:|dark:|space-|divide-|z-|inset-|top-|right-|bottom-|left-|opacity-|transition-|duration-|ease-|transform|scale-|rotate-|translate-|skew-|origin-|cursor-|select-|resize-|list-|appearance-|box-|float-|clear-|object-|overflow-|overscroll-|position-|static|fixed|absolute|relative|sticky|visible|invisible|whitespace-|break-|align-|font-|tracking-|leading-|content-|placeholder-|table-|order-|col-|row-|auto-cols-|auto-rows-|gap-|justify-|items-|self-|place-|content-|p-|m-|max-w-|max-h-|min-w-|min-h-|block|inline|flex|table|hidden|group|peer)\b/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
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
function shuffleQuestionChoices(question: TailwindInterviewQuestion): TailwindInterviewQuestion {
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
        stroke="#14b8a6"
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
        fill="#14b8a6"
        fontWeight="bold"
      >
        {Math.round(percent)}%
      </text>
    </svg>
  );
}

export default function TailwindInterviewPage() {
  const [shuffledQuestions, setShuffledQuestions] = useState<TailwindInterviewQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [shuffled, setShuffled] = useState(false);
  const router = useRouter();
  const retryCountRef = useRef(0);
  const [shouldRetry, setShouldRetry] = useState(true);

  const { data, loading: gqlLoading, error: gqlError, refetch } = useQuery(TAILWIND_INTERVIEW_QUESTIONS_QUERY, {
    onError: (error) => {
      // Increment retry counter for network errors
      if (shouldRetryBackendError(error)) {
        retryCountRef.current += 1;
      }
    }
  });
  
  // Reset retry count on successful load
  useEffect(() => {
    if (data && !gqlLoading) {
      retryCountRef.current = 0;
    }
  }, [data, gqlLoading]);

  const gqlQuestions: TailwindInterviewQuestion[] = data?.tailwindInterviewQuestions ?? [];

  const [submitAnswer] = useMutation(SUBMIT_TAILWIND_ANSWER_MUTATION);

  // Helper function to determine if we should retry based on error
  const shouldRetryBackendError = (error: any) => {
    return !!error && (
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('NetworkError') ||
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('timeout') ||
      error.message?.includes('502') ||  // Bad gateway (Render specific)
      error.message?.includes('503') ||  // Service unavailable
      error.message?.includes('504') ||  // Gateway timeout
      error.statusCode === 408 ||  // Request timeout
      error.statusCode === 502 ||  // Bad gateway
      error.statusCode === 503 ||  // Service unavailable
      error.statusCode === 504     // Gateway timeout
    );
  };

  // Handle manual retry
  const handleManualRetry = () => {
    retryCountRef.current = 0;
    setError(null);
    setLoading(true);
    refetch();
  };

  useEffect(() => {
    const saved = localStorage.getItem(TAILWIND_QUIZ_STORAGE_KEY);
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
      TAILWIND_QUIZ_STORAGE_KEY,
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
        submitTailwindAnswer: {
          isCorrect: false, // Optimistic default
          explanation: 'Checking...',
          __typename: 'AnswerResult',
        },
      },
    });
    setFeedback(data.submitTailwindAnswer);
    if (data.submitTailwindAnswer.isCorrect) setScore((s) => s + 1);
  };

  const nextQuestion = () => {
    setSelected(null);
    setFeedback(null);
    setCurrent((c) => c + 1);
  };

  const clearQuizState = () => {
    localStorage.removeItem(TAILWIND_QUIZ_STORAGE_KEY);
  };

  const restartQuiz = () => {
    clearQuizState();
    setCurrent(0);
    setSelected(null);
    setFeedback(null);
    setScore(0);
    setShuffled(false);
    retryCountRef.current = 0;
    setError(null);
    setLoading(true);
    refetch();
  };

  // If we're loading or have retry attempts, show the enhanced loading component
  if (gqlLoading || loading || retryCountRef.current > 0) {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <EnhancedLoadingComponent 
            retryCount={retryCountRef.current} 
            maxRetries={30} 
            error={gqlError}
            onRetry={handleManualRetry}
          />
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              We're automatically retrying while the backend starts up.
              If this takes too long, you can manually retry using the button above.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (gqlError && !shouldRetryBackendError(gqlError)) {
    return (
      // Updated container with glass morphism effect
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h2>
            <p className="mb-4 text-gray-800 dark:text-gray-200">Failed to load questions. Please try again.</p>
            <button
              onClick={handleManualRetry}
              className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!shuffledQuestions.length) return (
    // Updated container with glass morphism effect
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">No Questions Available</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">There are no Tailwind CSS interview questions available at this time.</p>
          <Link href="/" className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors duration-200">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
  
  if (current >= shuffledQuestions.length)
    return (
      // Updated container with glass morphism effect
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-4">
              Quiz Completed
            </h2>
            
            <div className="mb-6">
              <CircularProgress percent={Math.round((score / shuffledQuestions.length) * 100)} />
              <p className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-200">
                Score: {score}/{shuffledQuestions.length} ({Math.round((score / shuffledQuestions.length) * 100)}%)
              </p>
              <p className="mt-1 text-gray-600 dark:text-gray-300">
                {score >= Math.ceil(shuffledQuestions.length * 0.7) 
                  ? 'Great job! You have successfully passed the Tailwind CSS interview quiz.' 
                  : 'You need to score at least 70% to pass. Keep learning and try again!'}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link href="/" className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200">
                Return Home
              </Link>
              {score < Math.ceil(shuffledQuestions.length * 0.7) && (
                <Link href="/tailwind/lessons" className="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-lg hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-150 font-semibold">
                  Review Lessons
                </Link>
              )}
              <button
                onClick={restartQuiz}
                className="px-4 py-2 bg-teal-600 dark:bg-teal-700 text-white rounded-lg hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors duration-200"
              >
                Try Again
              </button>
            </div>

            {score >= Math.ceil(shuffledQuestions.length * 0.7) && (
              <div className="mt-8 p-6 border-2 border-teal-200 dark:border-teal-700 rounded-xl bg-teal-50/80 dark:bg-teal-900/30 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-teal-800 dark:text-teal-200 mb-2">Certificate of Completion</h3>
                <p className="text-teal-700 dark:text-teal-300">This certifies that you have successfully completed the Tailwind CSS interview preparation quiz.</p>
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
            className="bg-teal-600 dark:bg-teal-500 h-2 transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Question {current + 1} of {shuffledQuestions.length}</span>
              <h3 className="text-lg font-medium text-teal-600 dark:text-teal-400">{q.topic}</h3>
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
              <div className="space-y-3">
                {getDisplayChoices().map((choice, displayIndex) => (
                  <div 
                    key={displayIndex}
                    onClick={() => !feedback && setSelected(displayIndex)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 backdrop-blur-sm ${
                      feedback 
                        ? displayIndex === getDisplayCorrectAnswerIndex() 
                          ? "bg-green-50/80 dark:bg-green-900/40 border-green-300 dark:border-green-600" 
                          : displayIndex === selected 
                            ? "bg-red-50/80 dark:bg-red-900/40 border-red-300 dark:border-red-600" 
                            : "border-gray-200 dark:border-gray-600" 
                        : displayIndex === selected 
                          ? "bg-teal-50/80 dark:bg-teal-900/40 border-teal-300 dark:border-teal-600 shadow-sm" 
                          : "border-gray-200 dark:border-gray-600 hover:border-teal-200 dark:hover:border-teal-500 hover:bg-teal-50/80 dark:hover:bg-teal-900/30"
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 h-5 w-5 border rounded-full mt-0.5 mr-3 flex items-center justify-center transition-colors duration-200 ${
                        feedback 
                          ? displayIndex === getDisplayCorrectAnswerIndex() 
                            ? "bg-green-500 border-green-500" 
                            : displayIndex === selected 
                              ? "bg-red-500 border-red-500" 
                              : "border-gray-300 dark:border-gray-500" 
                          : displayIndex === selected 
                            ? "bg-teal-500 border-teal-500" 
                            : "border-gray-300 dark:border-gray-500"
                      }`}>
                        {(feedback && displayIndex === getDisplayCorrectAnswerIndex()) && (
                          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {(feedback && displayIndex === selected && displayIndex !== getDisplayCorrectAnswerIndex()) && (
                          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: formatQuestionText(choice) }}></span>
                    </div>
                  </div>
                ))}
              </div>
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
                    className="mt-2 px-4 py-2 bg-teal-600 dark:bg-teal-700 text-white rounded-lg hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors duration-200"
                  >
                    Show Answer
                  </button>
                )}
              </div>
            )}
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
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-700/80 backdrop-blur-sm transition-colors duration-200"
            >
              Exit Quiz
            </button>
            
            <div>
              {q.type === 'multiple-choice' && !feedback && (
                <button
                  onClick={handleSubmit}
                  disabled={selected === null}
                  className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                    selected === null 
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                      : 'bg-teal-600 dark:bg-teal-700 text-white hover:bg-teal-700 dark:hover:bg-teal-600'
                  }`}
                >
                  Submit
                </button>
              )}
              
              {feedback && (
                <button
                  onClick={nextQuestion}
                  className={`px-4 py-2 rounded-lg text-white transition-colors duration-200 ${
                    current === shuffledQuestions.length - 1 
                      ? 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600' 
                      : 'bg-teal-600 dark:bg-teal-700 hover:bg-teal-700 dark:hover:bg-teal-600'
                  }`}
                >
                  {current === shuffledQuestions.length - 1 ? 'Finish Quiz 🎉' : 'Next Question'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <TechnologyUtilizationBox 
        technology="Tailwind" 
        explanation="In this Tailwind CSS module, Tailwind is being used to style the entire application interface. All visual elements including this explanation box are styled using Tailwind's utility classes." 
      />
    </div>
  );
}