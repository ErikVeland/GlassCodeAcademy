"use client";

import { useState, useEffect } from 'react';
import type { ProgrammingQuestion } from '@/lib/contentRegistry';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';

// For client components in Next.js 15, params are still Promises that need to be awaited
export default function QuizQuestionPage({ params }: { params: Promise<{ moduleSlug: string; questionId: string }> }) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ moduleSlug: string; questionId: string } | null>(null);
  const [questionData, setQuestionData] = useState<ProgrammingQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);

  interface QuizSession {
    questions: ProgrammingQuestion[];
    totalQuestions: number;
    passingScore: number;
    timeLimit: number;
    startedAt: number;
    answers: ({ selectedIndex: number; correct: boolean } | null)[];
  }

  // Resolve the params promise
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const { moduleSlug, questionId } = await params;
        setResolvedParams({ moduleSlug, questionId });
        // Parse question ID
        const questionIndex = parseInt(questionId) - 1;

        // Load quiz session
        const sessionKey = `quizSession:${moduleSlug}`;
        const raw = typeof window !== 'undefined' ? sessionStorage.getItem(sessionKey) : null;
        if (!raw) {
          setLoading(false);
          notFound();
          return;
        }
        const session = JSON.parse(raw) as QuizSession;
        const total = session?.questions?.length ?? 0;
        setTotalQuestions(total);
        if (isNaN(questionIndex) || questionIndex < 0 || questionIndex >= total) {
          // End of quiz or invalid index
          router.push(`/modules/${moduleSlug}/quiz/results`);
          return;
        }
        const q = session.questions[questionIndex];
        setQuestionData(q);
        // Restore previous selection if exists
        const prev = session.answers?.[questionIndex] ?? null;
        if (prev) {
          setSelectedAnswer(prev.selectedIndex);
          setIsCorrect(prev.correct);
          setShowExplanation(true);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error resolving params:', error);
        notFound();
      }
    };

    resolveParams();
  }, [params]);

  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null || !questionData || !resolvedParams) return;
    const correct = selectedAnswer === questionData.correctAnswer;
    setIsCorrect(correct);
    setShowExplanation(true);
    // Persist answer to session
    try {
      const { moduleSlug, questionId } = resolvedParams;
      const sessionKey = `quizSession:${moduleSlug}`;
      const raw = sessionStorage.getItem(sessionKey);
      if (!raw) return;
      const session = JSON.parse(raw);
      const qIndex = parseInt(questionId) - 1;
      session.answers[qIndex] = { selectedIndex: selectedAnswer, correct };
      sessionStorage.setItem(sessionKey, JSON.stringify(session));
    } catch (e) {
      console.error('Failed to save answer', e);
    }
  };

  const handleNextQuestion = () => {
    if (!resolvedParams) return;
    const { moduleSlug, questionId } = resolvedParams;
    const nextIndex = parseInt(questionId);
    const sessionKey = `quizSession:${moduleSlug}`;
    const raw = sessionStorage.getItem(sessionKey);
    const total = raw ? (JSON.parse(raw)?.questions?.length ?? 0) : 0;
    if (nextIndex >= total) {
      router.push(`/modules/${moduleSlug}/quiz/results`);
    } else {
      router.push(`/modules/${moduleSlug}/quiz/question/${nextIndex + 1}`);
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
              Question {questionId} of {totalQuestions}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {Math.round((questionIndex / (totalQuestions || 1)) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${((questionIndex + 1) / (totalQuestions || 1)) * 100}%` }}
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
          {(questionData.choices ?? []).map((choice: string, index: number) => {
            const isSelected = selectedAnswer === index;
            const isCorrectAnswer = index === questionData.correctAnswer;
            
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
                className={choiceStyle.replace(/\bborder-[^\s]+\b/g, '').replace(/\bborder\b/g, '').replace(/\bring-[^\s]+\b/g, '') + ' focus:outline-none focus-visible:outline-none'}
                onClick={() => !showExplanation && handleAnswerSelect(index)}
              >
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-4 ${
                    showExplanation
                      ? isCorrectAnswer
                        ? "bg-green-500 text-white"
                        : isSelected && !isCorrectAnswer
                          ? "bg-red-500 text-white"
                          : "bg-transparent"
                      : isSelected
                        ? "bg-blue-500 text-white"
                        : "bg-transparent"
                  }`}>
                    {showExplanation && isCorrectAnswer && "✓"}
                    {showExplanation && isSelected && !isCorrectAnswer && "✗"}
                    {!showExplanation && isSelected && "✓"}
                  </div>
                  <span className="text-gray-800 dark:text-gray-200 leading-tight">{choice}</span>
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
                {questionIndex < totalQuestions - 1 ? "Next Question" : "View Results"}
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