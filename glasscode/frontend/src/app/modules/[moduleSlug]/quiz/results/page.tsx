"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// For client components in Next.js 15, params are still Promises that need to be awaited
export default function QuizResultsPage({ params }: { params: Promise<{ moduleSlug: string }> }) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ moduleSlug: string } | null>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Resolve the params promise
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const { moduleSlug } = await params;
        setResolvedParams({ moduleSlug });
        
        // Mock results data - in a real implementation, this would come from the quiz session
        const mockResults = {
          totalQuestions: 15,
          correctAnswers: 12,
          score: 80,
          passingScore: 70,
          timeTaken: "22:30",
          timeLimit: "30:00",
          passed: true,
          categoryScores: [
            { category: "Variables & Data Types", correct: 3, total: 3 },
            { category: "Control Structures", correct: 2, total: 3 },
            { category: "Functions & Scope", correct: 2, total: 2 },
            { category: "Data Structures", correct: 2, total: 2 },
            { category: "Error Handling", correct: 1, total: 2 },
            { category: "Algorithms", correct: 2, total: 3 }
          ]
        };

        // Simulate loading
        setTimeout(() => {
          setResults(mockResults);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error resolving params:', error);
      }
    };

    resolveParams();
  }, [params]);

  const handleRetakeQuiz = () => {
    if (!resolvedParams) return;
    router.push(`/modules/${resolvedParams.moduleSlug}/quiz/start`);
  };

  const handleReviewLessons = () => {
    if (!resolvedParams) return;
    router.push(`/modules/${resolvedParams.moduleSlug}/lessons`);
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
          <Link
            href={`/modules/${resolvedParams?.moduleSlug || ''}/quiz`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Quiz
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
            Results
          </li>
        </ol>
      </nav>

      {/* Results Header */}
      <header className="mb-12">
        <div className="glass-morphism p-8 rounded-xl text-center">
          <div className="mb-6">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${
              results.passed ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
            }`}>
              <span className={`text-5xl ${results.passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {results.passed ? "🎉" : "😔"}
              </span>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {results.passed ? "Congratulations! You Passed!" : "Quiz Complete"}
          </h1>
          
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-300">
                  {results.score}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Your Score
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                <div className="text-3xl font-bold text-green-600 dark:text-green-300">
                  {results.correctAnswers}/{results.totalQuestions}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Correct Answers
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-300">
                  {results.timeTaken}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Time Taken
                </div>
              </div>
            </div>
            
            <div className={`inline-block px-6 py-3 rounded-full text-lg font-semibold ${
              results.passed 
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200" 
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
            }`}>
              {results.passed ? "Passed" : "Not Passed"} • {results.passingScore}% required
            </div>
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
            {results.categoryScores.map((category: any, index: number) => {
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
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Review Lessons
              </button>
            </div>
            
            {results.passed ? (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  🚀 Continue Learning
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Move on to the next module to continue your learning journey.
                </p>
                <Link
                  href="/"
                  className="inline-block w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center"
                >
                  View Next Module
                </Link>
              </div>
            ) : (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  🔄 Retake Quiz
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Review the material and try the quiz again to demonstrate your knowledge.
                </p>
                <button
                  onClick={handleRetakeQuiz}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Retake Quiz
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Navigation Footer */}
      <footer className="flex justify-center">
        <Link
          href={`/modules/${moduleSlug}`}
          className="inline-flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Back to Module Overview
        </Link>
      </footer>
    </div>
  );
}