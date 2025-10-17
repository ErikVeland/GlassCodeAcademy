'use client';

import { useAppStats } from '@/hooks/useAppStats';
import StatCard from '@/components/stats/StatCard';
import PieChart from '@/components/stats/PieChart';
import AppProgressTracker from '@/components/AppProgressTracker';
import Link from 'next/link';
import {
  BookOpenIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
  ClockIcon,
  ChartBarIcon,
  SparklesIcon,
  TrophyIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import '@/styles/liquid-glass.scss';

// Function to properly capitalize module names
function capitalizeModuleName(name: string): string {
  // Special cases that should maintain specific capitalization
  const specialCases: { [key: string]: string } = {
    'dotnet': 'dotNet',
    'dot net': 'dotNet',
    'nextjs': 'nextJS',
    'next js': 'nextJS',
    'graphql': 'graphQL',
    'graph q l': 'graphQL',
    'sass': 'SASS',
    'scss': 'SASS'
  };

  const lowerName = name.toLowerCase();

  // Check for special cases first
  for (const [key, value] of Object.entries(specialCases)) {
    if (lowerName.includes(key)) {
      return value;
    }
  }

  // For regular names, capitalize each word
  return name.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function StatsPage() {
  const stats = useAppStats();

  if (stats.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="glass-card text-white dark:text-gray-200 text-xl">Loading stats...</div>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="glass-card text-red-400 dark:text-red-300 text-xl">Error loading stats: {stats.error}</div>
      </div>
    );
  }

  const totalContent = stats.totalLessons + stats.totalQuestions;

  return (
    <div className="liquid-glass-layout min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="liquid-glass-content container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white dark:text-gray-100 mb-4">
            📊 GlassStats
          </h1>
          <p className="text-xl text-gray-300 dark:text-gray-400 max-w-2xl mx-auto">
            There is so much to learn. So much to discover.
          </p>
        </div>
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          <StatCard
            title="Total Lessons"
            value={stats.totalLessons}
            icon={<BookOpenIcon className="h-8 w-8" />}
            color="blue"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Interview Questions"
            value={stats.totalQuestions}
            icon={<QuestionMarkCircleIcon className="h-8 w-8" />}
            color="green"
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Learning Modules"
            value={stats.totalModules}
            icon={<AcademicCapIcon className="h-8 w-8" />}
            color="purple"
            trend={{ value: 3, isPositive: true }}
          />
          <StatCard
            title="Avg. Completion Time"
            value={stats.averageCompletionTime}
            suffix=" min"
            icon={<ClockIcon className="h-8 w-8" />}
            color="orange"
          />
        </div>

        {/* Difficulty & Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-12">
          {/* Difficulty Breakdown */}
          <div className="glass-card">
            <h3 className="text-2xl font-bold text-white dark:text-gray-100 mb-6 flex items-center">
              <ChartBarIcon className="h-6 w-6 mr-2 text-indigo-400" />
              Difficulty Distribution
            </h3>
            <div className="w-full overflow-hidden">
              <PieChart
                data={[
                  {
                    label: 'Beginner',
                    value: stats.difficultyBreakdown.beginner,
                    color: '#10B981'
                  },
                  {
                    label: 'Intermediate',
                    value: stats.difficultyBreakdown.intermediate,
                    color: '#F59E0B'
                  },
                  {
                    label: 'Advanced',
                    value: stats.difficultyBreakdown.advanced,
                    color: '#EF4444'
                  }
                ]}
                size={240}
                strokeWidth={12}
              />
            </div>
          </div>

          {/* Learning Tiers */}
          <div className="glass-card flex flex-col">
            <h3 className="text-2xl font-bold text-white dark:text-gray-100 mb-6 flex items-center">
              <TrophyIcon className="h-6 w-6 mr-2 text-yellow-400" />
              Learning Tiers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              <div className="text-center p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl border border-blue-400/30 flex flex-col justify-center">
                <div className="text-2xl font-bold text-blue-300">{stats.tierBreakdown.foundational}</div>
                <div className="text-sm text-blue-400 font-medium">Foundational</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl border border-green-400/30 flex flex-col justify-center">
                <div className="text-2xl font-bold text-green-300">{stats.tierBreakdown.core}</div>
                <div className="text-sm text-green-400 font-medium">Core</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl border border-purple-400/30 flex flex-col justify-center">
                <div className="text-2xl font-bold text-purple-300">{stats.tierBreakdown.specialized}</div>
                <div className="text-sm text-purple-400 font-medium">Specialized</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl border border-orange-400/30 flex flex-col justify-center">
                <div className="text-2xl font-bold text-orange-300">{stats.tierBreakdown.quality}</div>
                <div className="text-sm text-orange-400 font-medium">Quality</div>
              </div>
            </div>
          </div>
        </div>

        {/* Module Breakdown */}
        <div className="glass-card mb-12">
          <h3 className="text-2xl font-bold text-white dark:text-gray-100 mb-6 flex items-center">
            <SparklesIcon className="h-6 w-6 mr-2 text-pink-400" />
            Technology Modules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stats.moduleBreakdown.map((module, index) => {
              const moduleSlug = module.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
              return (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-white/20 hover:border-white/40 transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer bg-white/5 hover:bg-white/10 relative group"
                  style={{ borderLeftColor: module.color, borderLeftWidth: '4px' }}
                >
                  {/* Direct Link Button */}
                  <Link
                    href={`/modules/${moduleSlug}`}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all duration-200 group/btn"
                  >
                    <svg
                      className="w-4 h-4 text-white/70 group-hover/btn:text-white transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>

                  <h4 className="font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors pr-8">{capitalizeModuleName(module.name)}</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Lessons:</span>
                      <span className="font-medium text-blue-400">{module.lessons}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Questions:</span>
                      <span className="font-medium text-green-400">{module.questions}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-gray-300">Total:</span>
                      <span style={{ color: module.color }}>{module.lessons + module.questions}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fun Facts */}
        <div className="glass-card bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 border-gradient">
          <h3 className="text-2xl font-bold mb-6 flex items-center text-white">
            <FireIcon className="h-6 w-6 mr-2 text-orange-400" />
            Fun Facts & Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{totalContent.toLocaleString()}</div>
              <div className="text-gray-300">Total Learning Items</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">
                {Math.round((stats.totalLessons / totalContent) * 100)}%
              </div>
              <div className="text-gray-300">Lessons vs Questions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">
                {Math.round(stats.averageCompletionTime * stats.totalLessons / 60)}h
              </div>
              <div className="text-gray-300">Total Learning Time</div>
            </div>
          </div>
        </div>

        {/* App Development Progress */}
        <div className="mb-12">
          <AppProgressTracker />
        </div>
      </div>
    </div>
  );
}
