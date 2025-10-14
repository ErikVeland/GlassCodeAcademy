'use client';

import BreadcrumbNavigation from './BreadcrumbNavigation';
import type { Module, Quiz } from '@/lib/contentRegistry';

interface QuizLayoutProps {
  module: Module;
  quiz?: Quiz | null;
  thresholds?: { requiredQuestions?: number; passingScore?: number } | null;
  unlockingModules?: Array<{ slug: string; title: string; routes: { overview: string } }>; 
  children?: React.ReactNode;
}

export default function QuizLayout({ module, thresholds, children }: QuizLayoutProps) {
  const passingScore = thresholds?.passingScore ?? 70;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <BreadcrumbNavigation />

      {/* Header */}
      <header className="mb-4">
        <div className="glass-morphism p-8 rounded-xl">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{module.title} Quiz</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Requires at least {passingScore}% to pass</p>
          </div>
          {/* Removed redundant quiz length display to avoid confusion */}
        </div>
      </header>

      {children}
    </div>
  );
}