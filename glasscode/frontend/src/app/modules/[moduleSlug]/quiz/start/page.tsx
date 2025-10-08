"use client";

import { useState, useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';

// For client components in Next.js 15, params are still Promises that need to be awaited
export default function QuizStartPage({ params }: { params: Promise<{ moduleSlug: string }> }) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ moduleSlug: string } | null>(null);
  const [quizData, setQuizData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve the params promise
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const { moduleSlug } = await params;
        setResolvedParams({ moduleSlug });
        
        // In a real implementation, this would fetch quiz data
        // For now, we'll simulate with mock data
        const mockQuiz = {
          title: "Programming Fundamentals Quiz",
          totalQuestions: 15,
          timeLimit: 30, // minutes
          passingScore: 70,
          instructions: [
            "You have 30 minutes to complete this quiz",
            "Each question has only one correct answer",
            "You can navigate between questions using the navigation buttons",
            "Your progress will be saved automatically",
            "Good luck!"
          ]
        };
        
        setQuizData(mockQuiz);
        setLoading(false);
      } catch (err) {
        setError("Failed to load quiz data");
        setLoading(false);
      }
    };

    resolveParams();
  }, [params]);

  const handleStartQuiz = () => {
    if (!resolvedParams) return;
    // In a real implementation, this would start the actual quiz
    // For now, we'll redirect to a placeholder
    router.push(`/modules/${resolvedParams.moduleSlug}/quiz/question/1`);
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
                  Make sure you're ready before clicking Start Quiz.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStartQuiz}
              className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-medium flex items-center justify-center"
            >
              Start Quiz
              <span className="ml-2">🎯</span>
            </button>
            
            <Link
              href={`/modules/${moduleSlug}/quiz`}
              className="px-8 py-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-lg font-medium flex items-center justify-center"
            >
              Cancel
              <span className="ml-2">←</span>
            </Link>
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