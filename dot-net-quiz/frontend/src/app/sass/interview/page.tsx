'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gql, useQuery } from '@apollo/client';
import TechnologyUtilizationBox from '../../../components/TechnologyUtilizationBox';
import EnhancedLoadingComponent from '../../../components/EnhancedLoadingComponent';

const GET_SASS_QUESTIONS = gql`
  query GetSassInterviewQuestions {
    sassInterviewQuestions {
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

interface SassInterviewQuestion {
  id: number;
  topic?: string | null;
  type?: string | null;
  question?: string | null;
  choices?: string[] | null;
  correctAnswer?: number | null;
  explanation?: string | null;
}

// Format code snippets with proper styling for both light and dark modes
function formatCode(text: string | undefined | null) {
  if (!text) return text;
  return text.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
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
        stroke="#ec4899"
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
        fill="#ec4899"
        fontWeight="bold"
      >
        {Math.round(percent)}%
      </text>
    </svg>
  );
}

export default function SassInterviewPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{isCorrect: boolean, explanation?: string} | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<SassInterviewQuestion[]>([]);
  const router = useRouter();
  const retryCountRef = useRef(0);
  const [shouldRetry, setShouldRetry] = useState(true); // Add this state
  
  const { loading, error, data, refetch } = useQuery(GET_SASS_QUESTIONS, {
    onError: (error) => {
      // Increment retry counter for network errors
      if (isNetworkError(error) && shouldRetry) {
        retryCountRef.current += 1;
      }
    }
  });
  
  // Reset retry count on successful load
  useEffect(() => {
    if (data && !loading) {
      retryCountRef.current = 0;
    }
  }, [data, loading]);

  // Helper function to determine if an error is a network error
  const isNetworkError = (error: any): boolean => {
    return !!error && (
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('NetworkError') ||
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('timeout') ||
      error.message?.includes('502') || // Bad Gateway
      error.message?.includes('503') || // Service Unavailable
      error.message?.includes('504') || // Gateway Timeout
      error.networkError
    );
  };

  // Handle manual retry
  const handleManualRetry = () => {
    retryCountRef.current = 0;
    setShouldRetry(true);
    refetch();
  };

  useEffect(() => {
    if (data?.sassInterviewQuestions) {
      // Shuffle questions randomly
      const shuffled = [...data.sassInterviewQuestions].sort(() => Math.random() - 0.5);
      setShuffledQuestions(shuffled);
    }
  }, [data]);

  const handleAnswer = (answerIndex: number) => {
    if (selected !== null) return; // Prevent multiple selections
    
    setSelected(answerIndex);
    
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    
    setFeedback({
      isCorrect,
      explanation: currentQuestion.explanation || undefined
    });
    
    const newAnswers = [...userAnswers, answerIndex];
    setUserAnswers(newAnswers);

    // Move to next question or show results after a delay
    setTimeout(() => {
      if (currentQuestionIndex < shuffledQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelected(null);
        setFeedback(null);
      } else {
        setShowResults(true);
      }
    }, 1500);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelected(null);
      setFeedback(null);
    } else {
      setShowResults(true);
    }
  };

  const clearQuizState = () => {
    // Clear any stored quiz state
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setSelected(null);
    setFeedback(null);
    setShowResults(false);
    retryCountRef.current = 0;
    setShouldRetry(true);
    
    // Reshuffle questions
    if (data?.sassInterviewQuestions) {
      const shuffled = [...data.sassInterviewQuestions].sort(() => Math.random() - 0.5);
      setShuffledQuestions(shuffled);
    }
  };

  // If we're loading or have retry attempts, show the enhanced loading component
  if (loading || retryCountRef.current > 0) {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <EnhancedLoadingComponent 
            retryCount={retryCountRef.current} 
            maxRetries={30} 
            error={error}
            onRetry={handleManualRetry}
          />
        </div>
      </div>
    );
  }
  
  if (error && !isNetworkError(error)) {
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
  
  if (!shuffledQuestions.length) {
    return (
      // Updated container with glass morphism effect
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">No Questions Available</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-300">There are no SASS interview questions available at this time.</p>
            <Link href="/" className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors duration-200">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const score = userAnswers.reduce((acc, answer, index) => {
    return acc + (answer === shuffledQuestions[index].correctAnswer ? 1 : 0);
  }, 0);
  
  const progress = ((currentQuestionIndex + 1) / shuffledQuestions.length) * 100;

  if (showResults) {
    return (
      // Updated container with glass morphism effect
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-pink-600 dark:text-pink-400 mb-4">
              Quiz Completed
            </h2>
            
            <div className="mb-6">
              <CircularProgress percent={Math.round((score / shuffledQuestions.length) * 100)} />
              <p className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-200">
                Score: {score}/{shuffledQuestions.length} ({Math.round((score / shuffledQuestions.length) * 100)}%)
              </p>
              <p className="mt-1 text-gray-600 dark:text-gray-300">
                {score === shuffledQuestions.length ? 'Perfect! You\'re a SASS expert! 🎉' : 
                 score >= shuffledQuestions.length * 0.8 ? 'Great job! You know your SASS well! 👍' : 
                 score >= shuffledQuestions.length * 0.6 ? 'Good effort! Keep learning! 💪' : 
                 'Keep practicing to improve your SASS skills! 📚'}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link href="/" className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200">
                Return Home
              </Link>
              {score < Math.ceil(shuffledQuestions.length * 0.7) && (
                <Link href="/sass/lessons" className="px-4 py-2 bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white rounded-lg hover:from-pink-600 hover:via-rose-600 hover:to-red-600 transition-all duration-150 font-semibold">
                  Review Lessons
                </Link>
              )}
              <button
                onClick={resetQuiz}
                className="px-4 py-2 bg-pink-600 dark:bg-pink-700 text-white rounded-lg hover:bg-pink-700 dark:hover:bg-pink-600 transition-colors duration-200"
              >
                Try Again
              </button>
            </div>

            {score >= Math.ceil(shuffledQuestions.length * 0.7) && (
              <div className="mt-8 p-6 border-2 border-pink-200 dark:border-pink-700 rounded-xl bg-pink-50/80 dark:bg-pink-900/30 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-pink-800 dark:text-pink-200 mb-2">Certificate of Completion</h3>
                <p className="text-pink-700 dark:text-pink-300">This certifies that you have successfully completed the SASS interview preparation quiz.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    // Updated container with glass morphism effect
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Progress bar */}
        <div className="bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm h-2">
          <div 
            className="bg-pink-600 dark:bg-pink-500 h-2 transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Question {currentQuestionIndex + 1} of {shuffledQuestions.length}</span>
              <h3 className="text-lg font-medium text-pink-600 dark:text-pink-400">{currentQuestion.topic}</h3>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Score</span>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{score}/{currentQuestionIndex}</p>
            </div>
          </div>
          
          {/* Question */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              <span dangerouslySetInnerHTML={{ __html: formatCode(currentQuestion.question) || '' }}></span>
            </h2>
            
            {/* Multiple choice */}
            {currentQuestion.choices && (
              <div className="space-y-3">
                {currentQuestion.choices.map((choice, index) => (
                  <div 
                    key={index}
                    onClick={() => !feedback && handleAnswer(index)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 backdrop-blur-sm ${
                      feedback 
                        ? index === currentQuestion.correctAnswer 
                          ? "bg-green-50/80 dark:bg-green-900/40 border-green-300 dark:border-green-600" 
                          : index === selected 
                            ? "bg-red-50/80 dark:bg-red-900/40 border-red-300 dark:border-red-600" 
                            : "border-gray-200 dark:border-gray-600" 
                        : index === selected 
                          ? "bg-pink-50/80 dark:bg-pink-900/40 border-pink-300 dark:border-pink-600 shadow-sm" 
                          : "border-gray-200 dark:border-gray-600 hover:border-pink-200 dark:hover:border-pink-500 hover:bg-pink-50/80 dark:hover:bg-pink-900/30"
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 h-5 w-5 border rounded-full mt-0.5 mr-3 flex items-center justify-center transition-colors duration-200 ${
                        feedback 
                          ? index === currentQuestion.correctAnswer 
                            ? "bg-green-500 border-green-500" 
                            : index === selected 
                              ? "bg-red-500 border-red-500" 
                              : "border-gray-300 dark:border-gray-500" 
                          : index === selected 
                            ? "bg-pink-500 border-pink-500" 
                            : "border-gray-300 dark:border-gray-500"
                      }`}>
                        {(feedback && index === currentQuestion.correctAnswer) && (
                          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {(feedback && index === selected && index !== currentQuestion.correctAnswer) && (
                          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: formatCode(choice) || '' }}></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Open-ended */}
            {currentQuestion.type === 'open-ended' && (
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50/80 dark:bg-gray-700/80 backdrop-blur-sm">
                <p className="text-gray-600 dark:text-gray-300 italic mb-2">This is an open-ended question. Think about your answer, then click &quot;Show Answer&quot; to see the explanation.</p>
                {feedback ? (
                  <div className="bg-green-50/80 dark:bg-green-900/40 border border-green-200 dark:border-green-700 rounded p-3 backdrop-blur-sm">
                    <p className="font-medium text-green-800 dark:text-green-200">Explanation:</p>
                    <p className="text-green-700 dark:text-green-300">{currentQuestion.explanation}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setFeedback({ isCorrect: true, explanation: currentQuestion.explanation ?? undefined });
                    }}
                    className="mt-2 px-4 py-2 bg-pink-600 dark:bg-pink-700 text-white rounded-lg hover:bg-pink-700 dark:hover:bg-pink-600 transition-colors duration-200"
                  >
                    Show Answer
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Feedback */}
          {feedback && currentQuestion.choices && (
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
              {feedback && (
                <button
                  onClick={nextQuestion}
                  className={`px-4 py-2 rounded-lg text-white transition-colors duration-200 ${
                    currentQuestionIndex === shuffledQuestions.length - 1 
                      ? 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600' 
                      : 'bg-pink-600 dark:bg-pink-700 hover:bg-pink-700 dark:hover:bg-pink-600'
                  }`}
                >
                  {currentQuestionIndex === shuffledQuestions.length - 1 ? 'Finish Quiz 🎉' : 'Next Question'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <TechnologyUtilizationBox 
        technology="SASS" 
        explanation="In this SASS module, SASS is being used to preprocess CSS for the application. The styling system uses SASS variables, nesting, and mixins to create maintainable stylesheets." 
      />
    </div>
  );
}