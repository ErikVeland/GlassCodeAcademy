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
  FireIcon,
  CogIcon,
  UsersIcon,
  PuzzlePieceIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import LoadingScreen from '@/components/LoadingScreen';
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
      <LoadingScreen message="Loading stats..." />
    );
  }

  if (stats.error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="glass-card text-danger text-xl">Error loading stats: {stats.error}</div>
      </div>
    );
  }

  const totalContent = stats.totalLessons + stats.totalQuestions;

  return (
    <div className="liquid-glass-layout min-h-screen bg-bg overflow-x-hidden">
      <div className="liquid-glass-content container mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-fg mb-4">
            📊 GlassStats
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto">
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
            <h3 className="text-2xl font-bold text-fg mb-6 flex items-center">
              <ChartBarIcon className="h-6 w-6 mr-2 text-primary" />
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
            <h3 className="text-2xl font-bold text-fg mb-6 flex items-center">
              <TrophyIcon className="h-6 w-6 mr-2 text-warning" />
              Learning Tiers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              <div className="text-center p-4 bg-surface-alt rounded-xl border border-border flex flex-col justify-center">
                <div className="text-2xl font-bold text-primary">{stats.tierBreakdown.foundational}</div>
                <div className="text-sm text-primary font-medium">Foundational</div>
              </div>
              <div className="text-center p-4 bg-surface-alt rounded-xl border border-border flex flex-col justify-center">
                <div className="text-2xl font-bold text-success">{stats.tierBreakdown.core}</div>
                <div className="text-sm text-success font-medium">Core</div>
              </div>
              <div className="text-center p-4 bg-surface-alt rounded-xl border border-border flex flex-col justify-center">
                <div className="text-2xl font-bold text-primary">{stats.tierBreakdown.specialized}</div>
                <div className="text-sm text-primary font-medium">Specialized</div>
              </div>
              <div className="text-center p-4 bg-surface-alt rounded-xl border border-border flex flex-col justify-center">
                <div className="text-2xl font-bold text-warning">{stats.tierBreakdown.quality}</div>
                <div className="text-sm text-warning font-medium">Quality</div>
              </div>
            </div>
          </div>
        </div>

        {/* Module Breakdown */}
        <div className="glass-card mb-12">
          <h3 className="text-2xl font-bold text-fg mb-6 flex items-center">
            <SparklesIcon className="h-6 w-6 mr-2 text-primary" />
            Technology Modules
          </h3>
          <div className="text-center mb-4 p-3 bg-green-500/10 border border-green-400/20 rounded-lg">
            <p className="text-green-400 font-medium">🎉 All 18 Technology Modules Complete! 🎉</p>
            <p className="text-green-300 text-sm mt-1">Programming, Web, React, Node, Database, .NET, TypeScript, and 11 more modules are fully implemented</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stats.moduleBreakdown.map((module, index) => {
              const moduleSlug = module.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
              return (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-border hover:opacity-90 transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer bg-surface-alt relative group"
                  style={{ borderLeftColor: module.color, borderLeftWidth: '4px' }}
                >
                  {/* Direct Link Button */}
                  <Link
                    href={`/modules/${moduleSlug}`}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-surface-alt hover:opacity-90 border border-border transition-all duration-200 group/btn"
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

                  <h4 className="font-bold text-fg mb-2 group-hover:text-primary transition-colors pr-8 truncate">{capitalizeModuleName(module.name)}</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Lessons:</span>
                      <span className="font-medium text-primary">{module.lessons}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Questions:</span>
                      <span className="font-medium text-success">{module.questions}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-muted">Total:</span>
                      <span style={{ color: module.color }}>{module.lessons + module.questions}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LMS Features Overview */}
        <div className="glass-card mb-12">
          <h3 className="text-2xl font-bold text-white dark:text-gray-100 mb-6 flex items-center">
            <AcademicCapIcon className="h-6 w-6 mr-2 text-indigo-400" />
            LMS Features & Capabilities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
             <StatCard
               title="Course Management"
               value={8}
               icon={<CogIcon className="h-8 w-8" />}
               color="blue"
               description="Features"
             />
             <StatCard
               title="User Engagement"
               value={6}
               icon={<UsersIcon className="h-8 w-8" />}
               color="green"
               description="Features"
             />
             <StatCard
               title="Integrations"
               value={7}
               icon={<PuzzlePieceIcon className="h-8 w-8" />}
               color="purple"
               description="Features"
             />
             <StatCard
               title="Admin & Support"
               value={5}
               icon={<ShieldCheckIcon className="h-8 w-8" />}
               color="orange"
               description="Features"
             />
             <StatCard
               title="Marketing & Sales"
               value={4}
               icon={<CurrencyDollarIcon className="h-8 w-8" />}
               color="pink"
               description="Features"
             />
             <StatCard
               title="Certification"
               value={3}
               icon={<DocumentCheckIcon className="h-8 w-8" />}
               color="indigo"
               description="Features"
             />
             <StatCard
               title="Additional Tools"
               value={3}
               icon={<ChatBubbleLeftRightIcon className="h-8 w-8" />}
               color="purple"
               description="Features"
             />
             <StatCard
               title="Total LMS Features"
               value={36}
               icon={<SparklesIcon className="h-8 w-8" />}
               color="indigo"
               description="Planned"
             />
           </div>
          
          {/* Feature Categories Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-fg mb-3">Core LMS Features</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-surface-alt rounded-lg border border-border">
                  <span className="text-primary">Advanced Course Creation</span>
                  <span className="text-xs bg-green-500/20 border border-green-400/30 rounded-full px-2 py-1 text-green-300">Completed</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-alt rounded-lg border border-border">
                  <span className="text-success">Advanced Quiz System</span>
                  <span className="text-xs bg-green-500/20 border border-green-400/30 rounded-full px-2 py-1 text-green-300">Completed</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-alt rounded-lg border border-border">
                  <span className="text-primary">Assignment Management</span>
                  <span className="text-xs bg-green-500/20 border border-green-400/30 rounded-full px-2 py-1 text-green-300">Completed</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-alt rounded-lg border border-border">
                  <span className="text-warning">Gradebook & Analytics</span>
                  <span className="text-xs bg-green-500/20 border border-green-400/30 rounded-full px-2 py-1 text-green-300">Completed</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-fg mb-3">Enterprise Features</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-surface-alt rounded-lg border border-border">
                  <span className="text-primary">Zoom & Google Meet Integration</span>
                  <span className="text-xs bg-green-500/20 border border-green-400/30 rounded-full px-2 py-1 text-green-300">Completed</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-alt rounded-lg border border-border">
                  <span className="text-danger">White Labeling & Branding</span>
                  <span className="text-xs bg-yellow-500/20 border border-yellow-400/30 rounded-full px-2 py-1 text-yellow-300">In Progress</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-alt rounded-lg border border-border">
                  <span className="text-primary">SCORM Compliance</span>
                  <span className="text-xs bg-yellow-500/20 border border-yellow-400/30 rounded-full px-2 py-1 text-yellow-300">In Progress</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-alt rounded-lg border border-border">
                  <span className="text-warning">Certificate Builder with QR</span>
                  <span className="text-xs bg-green-500/20 border border-green-400/30 rounded-full px-2 py-1 text-green-300">Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fun Facts */}
        <div className="glass-card bg-surface-alt border border-border">
          <h3 className="text-2xl font-bold mb-6 flex items-center text-fg">
            <FireIcon className="h-6 w-6 mr-2 text-warning" />
            Fun Facts & Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-fg">{totalContent.toLocaleString()}</div>
              <div className="text-muted">Total Learning Items</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-fg">
                {Math.round((stats.totalLessons / totalContent) * 100)}%
              </div>
              <div className="text-muted">Lessons vs Questions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-fg">
                {Math.round(stats.averageCompletionTime * totalContent / 60)}h
              </div>
              <div className="text-muted">Total Learning Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-fg">18/18</div>
              <div className="text-muted">Modules Complete</div>
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
