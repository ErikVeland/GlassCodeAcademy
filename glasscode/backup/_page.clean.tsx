"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gql } from '@apollo/client';
import { getApolloClient } from '../../../apolloClient';

// Update the type to include choice mapping
type LaravelInterviewQuestion = {
    id: number;
    topic: string;
    type: string;
    question: string;
    choices: string[];
    correctAnswer: number;
    explanation: string;
    choiceOrder?: number[]; // Track the order of choices after shuffling
};

interface AnswerResult {
  isCorrect: boolean;
  explanation?: string;
}

const LARAVEL_INTERVIEW_QUESTIONS_QUERY = gql`
  query LaravelInterviewQuestions {
    laravelInterviewQuestions {
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

const SUBMIT_LARAVEL_ANSWER_MUTATION = gql`
  mutation SubmitLaravelAnswer($questionId: Int!, $answerIndex: Int!) {
    submitLaravelAnswer(questionId: $questionId, answerIndex: $answerIndex) {
      isCorrect
      explanation
    }
  }
`;

function formatQuestionText(text: string) {
  // Only match whole words for code keywords
  return text.replace(/\b(Route|Model|Controller|View|Middleware|Migration|Eloquent|Blade|Facade|Service|Repository|Factory|Seeder|Artisan|Composer|Config|Env|Request|Response|Session|Cache|Queue|Event|Listener|Notification|Mail|Storage|File|DB|Schema|Collection|Carbon|Auth|Gate|Policy|Validation|Form|HTML|URL|Redirect|Cookie|Encryption|Hash|Password|Str|Arr|Log|Mail|Notification|Queue|Redis|Session|Storage|URL|Validator|View|App|Artisan|Auth|Blade|Broadcast|Bus|Cache|Config|Console|Container|Cookie|Database|DB|Encryption|Event|Exception|File|Foundation|Hash|Http|Log|Mail|Notification|Pagination|Pipeline|Queue|Redis|Routing|Session|Support|Translation|Validation|View)\b/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
}

function shuffle<T>(array: T[]): T[] {
  // Fisher-Yates shuffle
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Update the shuffle function to track choice order
function shuffleQuestionChoices(question: LaravelInterviewQuestion): LaravelInterviewQuestion {
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
        stroke="#ef4444"
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
        fill="#ef4444"
        fontWeight="bold"
      >
        {Math.round(percent)}%
      </text>
    </svg>
  );
}

export default function LaravelInterviewPage() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [shuffled, setShuffled] = useState(false);
  const [questions, setQuestions] = useState<LaravelInterviewQuestion[]>([]);
  const router = useRouter();

  // Get the choices in the correct display order
  const getDisplayChoices = () => {
    const question = questions[current];
    if (!question.choices) return [];
    if (!question.choiceOrder) return question.choices;
    
    // Return choices in the shuffled order
    return question.choiceOrder.map(index => question.choices![index]);
  };
  
  // Get the correct answer index in the display order
  const getDisplayCorrectAnswerIndex = () => {
    const question = questions[current];
    if (!question.choiceOrder) return question.correctAnswer;
    
    // Find where the original correct answer is in the shuffled order
    return question.choiceOrder.indexOf(question.correctAnswer);
  };

  // Fetch questions on mount
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const client = getApolloClient();
        const { data } = await client.query({
          query: LARAVEL_INTERVIEW_QUESTIONS_QUERY
        });
        
        if (data?.laravelInterviewQuestions) {
          setQuestions(data.laravelInterviewQuestions);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Failed to load questions. Please try again.');
        setLoading(false);
      }
    }

    fetchQuestions();
  }, []);

  // Shuffle questions and their choices once when loaded
  useEffect(() => {
    if (questions.length > 0 && !shuffled) {
      // Shuffle both questions and create choice order mapping
      const shuffledQuestions = shuffle(questions).map(q => shuffleQuestionChoices(q));
      setQuestions(shuffledQuestions);
      setShuffled(true);
    }
  }, [questions, shuffled]);

  const handleSubmit = async () => {
    if (selected === null) return;
    
    try {
      setLoading(true);
      const client = getApolloClient();
      
      // Map the selected display index back to the original index
      let originalSelectedIndex = selected;
      if (questions[current].choiceOrder) {
        // The selected index is the display index, we need the original index
        originalSelectedIndex = questions[current].choiceOrder![selected];
      }
      
      const { data } = await client.mutate({
        mutation: SUBMIT_LARAVEL_ANSWER_MUTATION,
        variables: {
          questionId: questions[current].id,
          answerIndex: originalSelectedIndex
        }
      });
      
      const result = data?.submitLaravelAnswer;
      setFeedback(result);
      if (result?.isCorrect) {
        setScore(score + 1);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
      setSelected(null);
      setFeedback(null);
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setSelected(null);
    setFeedback(null);
    setScore(0);
    setShuffled(false);
  };

  if (loading && questions.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="animate-pulse flex flex-col items-center justify-center space-y-4">
            <div className="h-12 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-64 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h2>
            <p className="mb-4 text-gray-800 dark:text-gray-200">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">No Questions Available</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-300">There are no Laravel interview questions available at this time.</p>
            <Link href="/" className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Quiz completed
  if (current >= questions.length) {
    const passScore = Math.ceil(questions.length * 0.7); // 70% to pass
    const passed = score >= passScore;
    const successRate = Math.round((score / questions.length) * 100);

    return (
      <div className="bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center">
            <h2 className={`text-3xl font-bold ${passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} mb-4`}>
              {passed ? 'Congratulations! 🎉' : 'Quiz Completed'}
            </h2>
            
            <div className="mb-6">
              <CircularProgress percent={successRate} />
              <p className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-200">
                Score: {score}/{questions.length} ({successRate}%)
              </p>
              <p className="mt-1 text-gray-600 dark:text-gray-300">
                {passed 
                  ? 'Great job! You have successfully passed the Laravel interview quiz.' 
                  : 'You need to score at least 70% to pass. Keep learning and try again!'}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link href="/" className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600">
                Return Home
              </Link>
              {!passed && (
                <Link href="/laravel/lessons" className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600">
                  Review Lessons
                </Link>
              )}
              <button
                onClick={handleRestart}
                className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600"
              >
                Try Again
              </button>
            </div>

            {passed && (
              <div className="mt-8 p-6 border-2 border-red-200 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20">
                <h3 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Certificate of Completion</h3>
                <p className="text-red-700 dark:text-red-300">This certifies that you have successfully completed the Laravel interview preparation quiz.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const question = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* Progress bar */}
        <div className="bg-gray-100 dark:bg-gray-700 h-2">
          <div 
            className="bg-red-600 dark:bg-red-500 h-2 transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Question {current + 1} of {questions.length}</span>
              <h3 className="text-lg font-medium text-red-600 dark:text-red-400">{question.topic}</h3>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Score</span>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{score}/{current}</p>
            </div>
          </div>
          
          {/* Question */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              <span dangerouslySetInnerHTML={{ __html: formatQuestionText(question.question) }}></span>
            </h2>
            
            {/* Multiple choice */}
            {question.type === 'multiple-choice' && question.choices && (
              <div className="space-y-3">
                {getDisplayChoices().map((choice, displayIndex) => (
                  <div 
                    key={displayIndex}
                    onClick={() => !feedback && setSelected(displayIndex)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${feedback 
                      ? displayIndex === getDisplayCorrectAnswerIndex() 
                        ? "bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600" 
                        : displayIndex === selected 
                          ? "bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-600" 
                          : "border-gray-200 dark:border-gray-600" 
                      : displayIndex === selected 
                        ? "bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-600" 
                        : "border-gray-200 dark:border-gray-600 hover:border-red-200 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 h-5 w-5 border rounded-full mt-0.5 mr-3 ${feedback 
                      ? displayIndex === getDisplayCorrectAnswerIndex() 
                        ? "bg-green-500 border-green-500" 
                        : displayIndex === selected 
                          ? "bg-red-500 border-red-500" 
                          : "border-gray-300 dark:border-gray-500" 
                      : displayIndex === selected 
                        ? "bg-red-500 border-red-500" 
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
          {question.type === 'open-ended' && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
              <p className="text-gray-600 dark:text-gray-300 italic mb-2">This is an open-ended question. Think about your answer, then click &quot;Show Answer&quot; to see the explanation.</p>
              {feedback ? (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded p-3">
                  <p className="font-medium text-green-800 dark:text-green-200">Explanation:</p>
                  <p className="text-green-700 dark:text-green-300">{question.explanation}</p>
                </div>
              ) : (
                <button
                  onClick={() => setFeedback({ isCorrect: true, explanation: question.explanation })}
                  className="mt-2 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600"
                >
                  Show Answer
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Feedback */}
        {feedback && question.type === 'multiple-choice' && (
          <div className={`mb-6 p-4 border rounded-lg ${feedback.isCorrect ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700'}`}>
            <p className={`font-medium ${feedback.isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
              {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
            </p>
            {feedback.explanation && (
              <div className="mt-2">
                <p className="font-medium text-gray-800 dark:text-gray-200">Explanation:</p>
                <p className={feedback.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>{feedback.explanation}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex justify-between">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Exit Quiz
          </button>
          
          <div>
            {question.type === 'multiple-choice' && !feedback && (
              <button
                onClick={handleSubmit}
                disabled={selected === null || loading}
                className={`px-4 py-2 rounded ${selected === null ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-600'}`}
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            )}
            
            {feedback && (
              <button
                onClick={handleNext}
                className={`px-4 py-2 rounded text-white ${
                  current === questions.length - 1 
                    ? 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600' 
                    : 'bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600'
                }`}
              >
                {current === questions.length - 1 ? 'Finish Quiz 🎉' : 'Next Question'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}