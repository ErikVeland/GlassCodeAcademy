"use client";

import { useState, useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';

// For client components in Next.js 15, params are still Promises that need to be awaited
export default function QuizQuestionPage({ params }: { params: Promise<{ moduleSlug: string; questionId: string }> }) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ moduleSlug: string; questionId: string } | null>(null);
  const [questionData, setQuestionData] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Resolve the params promise
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const { moduleSlug, questionId } = await params;
        setResolvedParams({ moduleSlug, questionId });
        
        // Parse question ID
        const questionIndex = parseInt(questionId) - 1;
        
        // Mock quiz data - in a real implementation, this would come from an API
        const mockQuizData = {
          totalQuestions: 15,
          questions: Array.from({ length: 15 }, (_, i) => ({
            id: i + 1,
            type: i % 3 === 0 ? 'multiple-choice' : i % 3 === 1 ? 'true-false' : 'scenario',
            question: `This is a sample question ${i + 1} about programming concepts. What is the correct answer to this important concept?`,
            choices: [
              `Option A for question ${i + 1}`,
              `Option B for question ${i + 1}`,
              `Option C for question ${i + 1}`,
              `Option D for question ${i + 1}`
            ],
            correctAnswer: `Option ${String.fromCharCode(65 + (i % 4))} for question ${i + 1}`,
            explanation: `This explanation describes why the correct answer is what it is for question ${i + 1}. Understanding this concept is crucial for mastering the material.`
          }))
        };

        // Validate question ID
        if (isNaN(questionIndex) || questionIndex < 0 || questionIndex >= mockQuizData.totalQuestions) {
          notFound();
          return;
        }

        // Set current question data
        setQuestionData(mockQuizData.questions[questionIndex]);
        setLoading(false);
      } catch (error) {
        console.error('Error resolving params:', error);
        notFound();
      }
    };

    resolveParams();
  }, [params]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || !questionData) return;
    
    const correct = selectedAnswer === questionData.correctAnswer;
    setIsCorrect(correct);
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (!resolvedParams) return;
    
    const { moduleSlug, questionId } = resolvedParams;
    const questionIndex = parseInt(questionId) - 1;
    
    if (questionIndex < 14) { // 15 questions total (0-14)
      router.push(`/modules/${moduleSlug}/quiz/question/${questionIndex + 2}`);
    } else {
      // Quiz completed - redirect to results
      router.push(`/modules/${moduleSlug}/quiz/results`);
    }
  };

  const handlePreviousQuestion = () => {
    if (!resolvedParams) return;
    
    const { moduleSlug, questionId } = resolvedParams;
    const questionIndex = parseInt(questionId) - 1;
    
    if (questionIndex > 0) {
      router.push(`/modules/${moduleSlug}/quiz/question/${questionIndex}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="glass-morphism p-12 rounded-xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading question...</p>
        </div>
      </div>
    );
  }

  if (!resolvedParams || !questionData) {
    notFound();
    return null;
  }

  const { moduleSlug, questionId } = resolvedParams;
  const questionIndex = parseInt(questionId) - 1;
  
  // Mock quiz data for navigation buttons
  const mockQuizData = {
    totalQuestions: 15
  };

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
            Question {questionId}
          </li>
        </ol>
      </nav>

      {/* Quiz Progress */}
      <div className="mb-8">
        <div className="glass-morphism p-4 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Question {questionId} of {mockQuizData.totalQuestions}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {Math.round((questionIndex / mockQuizData.totalQuestions) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${((questionIndex + 1) / mockQuizData.totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="glass-morphism p-8 rounded-xl mb-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-bold">
            {questionId}
          </span>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {questionData.type === 'multiple-choice' && 'Multiple Choice'}
            {questionData.type === 'true-false' && 'True or False'}
            {questionData.type === 'scenario' && 'Scenario-Based'}
          </h1>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
          <p className="text-gray-800 dark:text-gray-200 text-lg">
            {questionData.question}
          </p>
        </div>

        {/* Answer Choices */}
        <div className="space-y-3 mb-8">
          {questionData.choices.map((choice: string, index: number) => {
            const isSelected = selectedAnswer === choice;
            const isCorrectAnswer = choice === questionData.correctAnswer;
            
            let choiceStyle = "flex items-center p-4 rounded-lg border cursor-pointer transition-colors ";
            
            if (showExplanation) {
              if (isCorrectAnswer) {
                choiceStyle += "border-green-500 bg-green-50 dark:bg-green-900/30";
              } else if (isSelected && !isCorrectAnswer) {
                choiceStyle += "border-red-500 bg-red-50 dark:bg-red-900/30";
              } else {
                choiceStyle += "border-gray-200 dark:border-gray-700";
              }
            } else {
              choiceStyle += isSelected 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30" 
                : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700";
            }

            return (
              <div
                key={index}
                className={choiceStyle}
                onClick={() => !showExplanation && handleAnswerSelect(choice)}
              >
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center mr-4 ${
                    showExplanation
                      ? isCorrectAnswer
                        ? "border-green-500 bg-green-500 text-white"
                        : isSelected && !isCorrectAnswer
                          ? "border-red-500 bg-red-500 text-white"
                          : "border-gray-300 dark:border-gray-600"
                      : isSelected
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-gray-300 dark:border-gray-600"
                  }`}>
                    {showExplanation && isCorrectAnswer && "✓"}
                    {showExplanation && isSelected && !isCorrectAnswer && "✗"}
                    {!showExplanation && isSelected && "✓"}
                  </div>
                  <span className="text-gray-800 dark:text-gray-200">{choice}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className={`p-4 rounded-lg mb-6 ${
            isCorrect 
              ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800" 
              : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800"
          }`}>
            <div className="flex items-start gap-3">
              <span className="text-xl">
                {isCorrect ? "✅" : "❌"}
              </span>
              <div>
                <h3 className={`font-semibold ${
                  isCorrect ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"
                }`}>
                  {isCorrect ? "Correct!" : "Incorrect"}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mt-2">
                  {questionData.explanation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-between">
          <div>
            {questionIndex > 0 && (
              <button
                onClick={handlePreviousQuestion}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center"
              >
                <span className="mr-2">←</span>
                Previous
              </button>
            )}
          </div>
          
          <div className="flex gap-4">
            {!showExplanation ? (
              <button
                onClick={handleSubmit}
                disabled={!selectedAnswer}
                className={`px-6 py-2 rounded-lg transition-colors flex items-center ${
                  selectedAnswer
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Submit Answer
                <span className="ml-2">→</span>
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                {questionIndex < mockQuizData.totalQuestions - 1 ? "Next Question" : "View Results"}
                <span className="ml-2">→</span>
              </button>
            )}
          </div>
        </div>
      </div>

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