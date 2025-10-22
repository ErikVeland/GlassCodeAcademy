"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';
import type { ProgrammingQuestion } from '@/lib/contentRegistry';
import Link from 'next/link';

interface QuizSession {
  questions: ProgrammingQuestion[];
  totalQuestions: number;
  passingScore: number;
  timeLimit: number;
  startedAt: number;
  answers: (string | null)[];
}

export default function QuizPage({ params }: { params: Promise<{ moduleSlug: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeQuiz = useCallback(async (slug: string) => {
    try {
      const mod = await contentRegistry.getModule(slug);
      if (!mod) {
        setError('Module not found');
        return;
      }
      const moduleQuiz = await contentRegistry.getModuleQuiz(slug);

      if (!moduleQuiz?.questions || moduleQuiz.questions.length === 0) {
        setError('No quiz questions available');
        return;
      }

      const targetQuestions = mod.metadata?.thresholds?.minQuizQuestions ?? mod.thresholds?.requiredQuestions ?? 14;
      const allQuestions = moduleQuiz.questions;

      const historyKey = `quiz_history_${slug}`;
      const historyData = localStorage.getItem(historyKey);
      const recentQuestionIds = historyData ? JSON.parse(historyData) : [];

      const availableQuestions = allQuestions.filter((q: ProgrammingQuestion) => !recentQuestionIds.includes(q.id));
      const questionsToUse = availableQuestions.length >= targetQuestions ? availableQuestions : allQuestions;
      const shuffled = [...questionsToUse].sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, targetQuestions);

      const processedQuestions = selectedQuestions.map((question: ProgrammingQuestion) => {
        if (question.type === 'multiple-choice' && question.choices && !question.fixedChoiceOrder) {
          const originalChoices = question.choices;
          const originalCorrectIndex = typeof question.correctAnswer === 'number' ? question.correctAnswer : -1;
          const originalCorrectChoice = originalCorrectIndex >= 0 && originalCorrectIndex < originalChoices.length
            ? originalChoices[originalCorrectIndex]
            : undefined;
          const shuffledChoices = [...originalChoices].sort(() => Math.random() - 0.5);
          let newCorrectIndex = originalCorrectIndex;
          if (originalCorrectChoice !== undefined) {
            const idx = shuffledChoices.findIndex(c => c === originalCorrectChoice);
            newCorrectIndex = idx >= 0 ? idx : 0;
          }
          return { ...question, choices: shuffledChoices, correctAnswer: newCorrectIndex };
        }
        return question;
      });

      const timeLimit = Math.min(Math.max(Math.ceil(targetQuestions * 1.5), 10), 45);
      const passingScore = mod.metadata?.thresholds?.passingScore || 70;

      const sessionPayload: QuizSession = {
        questions: processedQuestions,
        totalQuestions: targetQuestions,
        passingScore,
        timeLimit,
        startedAt: Date.now(),
        answers: new Array(targetQuestions).fill(null)
      };

      const sessionKey = `quizSession:${slug}`;
      sessionStorage.setItem(sessionKey, JSON.stringify(sessionPayload));

      const newQuestionIds = processedQuestions.map((q: ProgrammingQuestion) => q.id);
      const updatedHistory = [...newQuestionIds, ...recentQuestionIds].slice(0, 200);
      localStorage.setItem(historyKey, JSON.stringify(updatedHistory));

      router.push(`/modules/${slug}/quiz/question/1`);
    } catch (err) {
      console.error('Error initializing module quiz:', err);
      setError('Failed to initialize quiz');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    async function init() {
      const resolved = await params;
      const slug = resolved.moduleSlug;
      await initializeQuiz(slug);
    }
    init();
  }, [params, initializeQuiz]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Initializing quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            {error}
          </h2>
          <Link
            href="/modules"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Modules
          </Link>
        </div>
      </div>
    );
  }

  return null;
}