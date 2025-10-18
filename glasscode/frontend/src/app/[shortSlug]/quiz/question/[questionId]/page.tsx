"use client";

import { useState, useEffect } from 'react';
import type { ProgrammingQuestion } from '@/lib/contentRegistry';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';

// For client components in Next.js 15, params are still Promises that need to be awaited
export default function QuizQuestionPage({ params }: { params: Promise<{ shortSlug: string; questionId: string }> }) {
  const renderInlineCode = (text: string) => {
    // Split by backticked segments while preserving them
    const parts = String(text).split(/(`[^`]+`)/g).filter(p => p.length > 0);
    // Merge adjacent code parts into a single code element for readability
    const merged: Array<{ type: 'code' | 'text'; value: string }> = [];
    for (const part of parts) {
      const codeMatch = part.match(/^`([^`]+)`$/);
      if (codeMatch) {
        const val = codeMatch[1];
        const last = merged[merged.length - 1];
        if (last && last.type === 'code') {
          last.value += ` ${val}`;
        } else {
          merged.push({ type: 'code', value: val });
        }
      } else {
        merged.push({ type: 'text', value: part });
      }
    }
    return merged.map((seg, i) => (seg.type === 'code' ? <code key={i}>{seg.value}</code> : <span key={i}>{seg.value}</span>));
  };
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ shortSlug: string; questionId: string } | null>(null);
  const [questionData, setQuestionData] = useState<ProgrammingQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [enteredText, setEnteredText] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [quizEndAt, setQuizEndAt] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number>(0);

  interface QuizSession {
    questions: ProgrammingQuestion[];
    totalQuestions: number;
    passingScore: number;
    timeLimit: number;
    startedAt: number;
    startTime?: number;
    answers: ({ selectedIndex?: number; enteredText?: string; correct: boolean } | null)[];
  }

  // Resolve the params promise
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const { shortSlug, questionId } = await params;
        setResolvedParams({ shortSlug, questionId });
        // Parse question ID
        const questionIndex = parseInt(questionId) - 1;

        // Load quiz session
        const sessionKey = `quizSession:${shortSlug}`;
        const raw = typeof window !== 'undefined' ? sessionStorage.getItem(sessionKey) : null;
        if (!raw) {
          setLoading(false);
          notFound();
          return;
        }
        const session = JSON.parse(raw) as QuizSession;
        
        // DEBUG: Log session data
        console.log('Quiz Question Page Debug:', {
          sessionKey,
          sessionExists: !!session,
          questionsCount: session?.questions?.length ?? 0,
          questionIndex,
          questionId,
          sessionQuestions: session?.questions?.map(q => ({ id: q.id, question: q.question?.substring(0, 50) + '...' })) ?? []
        });
        
        const total = session?.questions?.length ?? 0;
        setTotalQuestions(total);
        if (isNaN(questionIndex) || questionIndex < 0 || questionIndex >= total) {
          // End of quiz or invalid index
          router.push(`/${shortSlug}/quiz/results`);
          return;
        }
        const q = session.questions[questionIndex];
        setQuestionData(q);
        // Setup countdown timer
        const started = (session.startedAt ?? session.startTime ?? Date.now());
        const endAt = started + (session.timeLimit || 0) * 60 * 1000;
        setQuizEndAt(endAt);
        setRemainingMs(Math.max(0, endAt - Date.now()));
        // Restore previous selection if exists
        const prev = session.answers?.[questionIndex] ?? null;
        if (prev) {
          if (typeof prev.selectedIndex === 'number') {
            setSelectedAnswer(prev.selectedIndex);
          }
          if (typeof prev.enteredText === 'string') {
            setEnteredText(prev.enteredText);
          }
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
  }, [params, router]);

  // Countdown effect
  useEffect(() => {
    if (!quizEndAt || !resolvedParams) return;
    const { shortSlug } = resolvedParams;
    const interval = setInterval(() => {
      const ms = quizEndAt - Date.now();
      if (ms <= 0) {
        clearInterval(interval);
        setRemainingMs(0);
        router.push(`/${shortSlug}/quiz/results`);
      } else {
        setRemainingMs(ms);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [quizEndAt, resolvedParams, router]);

  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (!questionData || !resolvedParams) return;
    let correct = false;

    const isOpenEnded = (questionData.type === 'open-ended') || ((questionData.acceptedAnswers ?? []).length > 0);
    if (isOpenEnded) {
      const accepted = (questionData.acceptedAnswers ?? []).map(a => String(a).trim().toLowerCase());
      const candidate = String(enteredText || '').trim().toLowerCase();
      correct = candidate.length > 0 && accepted.includes(candidate);
    } else {
      if (selectedAnswer === null) return; // must select
      correct = selectedAnswer === questionData.correctAnswer;
    }

    setIsCorrect(correct);
    setShowExplanation(true);
    // Persist answer to session
    try {
      const { shortSlug, questionId } = resolvedParams;
      const sessionKey = `quizSession:${shortSlug}`;
      const raw = sessionStorage.getItem(sessionKey);
      if (!raw) return;
      const session = JSON.parse(raw);
      const qIndex = parseInt(questionId) - 1;
      const payload = isOpenEnded
        ? { enteredText, correct }
        : { selectedIndex: selectedAnswer, correct };
      session.answers[qIndex] = payload;
      sessionStorage.setItem(sessionKey, JSON.stringify(session));
    } catch (e) {
      console.error('Failed to save answer', e);
    }
  };

  const handleNextQuestion = () => {
    if (!resolvedParams) return;
    const { shortSlug, questionId } = resolvedParams;
    const nextIndex = parseInt(questionId);
    const sessionKey = `quizSession:${shortSlug}`;
    const raw = sessionStorage.getItem(sessionKey);
    const total = raw ? (JSON.parse(raw)?.questions?.length ?? 0) : 0;
    if (nextIndex >= total) {
      router.push(`/${shortSlug}/quiz/results`);
    } else {
      router.push(`/${shortSlug}/quiz/question/${nextIndex + 1}`);
    }
  };

  const handlePreviousQuestion = () => {
    if (!resolvedParams) return;
    
    const { shortSlug, questionId } = resolvedParams;
    const questionIndex = parseInt(questionId) - 1;
    
    if (questionIndex > 0) {
      router.push(`/${shortSlug}/quiz/question/${questionIndex}`);
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

  const { shortSlug, questionId } = resolvedParams;
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
            <Link href={`/${shortSlug}`} className="text-blue-600 hover:text-blue-800">
              Module
            </Link>
          </li>
          <li className="text-gray-500">/</li>
          <li>
            <Link href={`/${shortSlug}/quiz`} className="text-blue-600 hover:text-blue-800">
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
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Time Left: {new Date(remainingMs).toISOString().substring(14,19)}
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
            {renderInlineCode(questionData.question)}
          </p>
        </div>

        {/* Answer Input */}
        {((questionData.type === 'open-ended') || ((questionData.acceptedAnswers ?? []).length > 0)) ? (
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Answer
            </label>
            <input
              type="text"
              value={enteredText}
              onChange={(e) => !showExplanation && setEnteredText(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              placeholder="Type your answer"
            />
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {(questionData.choices ?? []).map((choice: string, index: number) => {
              const isSelected = selectedAnswer === index;
              const isCorrectAnswer = index === questionData.correctAnswer;
              const baseClasses = 'radio-option';
              const stateClass = showExplanation
                ? (isCorrectAnswer ? ' is-correct' : (isSelected && !isCorrectAnswer ? ' is-incorrect' : ''))
                : (isSelected ? ' is-selected' : '');
              const showLetters = (questionData as { choiceLabels?: 'letters' | 'none' }).choiceLabels === 'letters';
              const letter = String.fromCharCode(65 + index);
              return (
                <label key={index} className={baseClasses + stateClass}>
                  <input
                    type="radio"
                    name="answer"
                    className="sweet-radio-input"
                    checked={selectedAnswer === index}
                    onChange={() => !showExplanation && handleAnswerSelect(index)}
                    aria-checked={selectedAnswer === index}
                  />
                  <span className="sweet-radio-visual" aria-hidden="true" />
                  <span className="radio-text">
                    {showLetters && (
                      <span className="mr-2 inline-block font-semibold text-gray-700 dark:text-gray-300" aria-hidden="true">
                        {letter}.
                      </span>
                    )}
                    {renderInlineCode(choice)}
                  </span>
                </label>
              );
            })}
          </div>
        )}

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
                  {renderInlineCode(questionData.explanation || '')}
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
                disabled={selectedAnswer === null}
                className={`px-6 py-2 rounded-lg transition-colors flex items-center ${
                  selectedAnswer !== null
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
          href={`/${shortSlug}/quiz`}
          className="inline-flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Back to Quiz Overview
        </Link>
      </footer>
    </div>
  );
}