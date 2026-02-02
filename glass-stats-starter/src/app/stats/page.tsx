"use client";

import { useEffect } from "react";
import { useAppStats } from "@/hooks/useAppStats";
import StatCard from "@/components/stats/StatCard";
import PieChart from "@/components/stats/PieChart";
import AppProgressTracker from "@/components/AppProgressTracker";
import LoadingScreen from "@/components/LoadingScreen";
import "@/styles/liquid-glass.scss";
import { capitalizeModuleName } from "@/lib/stats/formatters";
import {
  AcademicCapIcon,
  BookOpenIcon,
  ChartBarIcon,
  ClockIcon,
  FireIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export default function StatsPage() {
  const stats = useAppStats();

  useEffect(() => {
    document.title = "GlassStats Starter";
  }, []);

  if (stats.isLoading) return <LoadingScreen message="Loading stats..." />;
  if (stats.error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="glass-card text-danger text-lg">{stats.error}</div>
      </div>
    );
  }

  const totalContent = stats.totalLessons + stats.totalQuestions;

  return (
    <div className="liquid-glass-layout min-h-screen bg-bg overflow-x-hidden">
      <div className="liquid-glass-content mx-auto py-10 overflow-x-hidden">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-fg mb-3">
            📊 GlassStats
          </h1>
          <p className="text-muted max-w-2xl mx-auto">
            A compact, portable dashboard to show off real development progress.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-10">
          <div className="glass-card">
            <h3 className="text-2xl font-bold text-fg mb-6 flex items-center">
              <ChartBarIcon className="h-6 w-6 mr-2 text-primary" />
              Difficulty Distribution
            </h3>
            <div className="w-full overflow-hidden">
              <PieChart
                data={[
                  {
                    label: "Beginner",
                    value: stats.difficultyBreakdown.beginner,
                    color: "#10B981",
                  },
                  {
                    label: "Intermediate",
                    value: stats.difficultyBreakdown.intermediate,
                    color: "#F59E0B",
                  },
                  {
                    label: "Advanced",
                    value: stats.difficultyBreakdown.advanced,
                    color: "#EF4444",
                  },
                ]}
                size={240}
                strokeWidth={12}
              />
            </div>
          </div>

          <div className="glass-card">
            <h3 className="text-2xl font-bold text-fg mb-6 flex items-center">
              <SparklesIcon className="h-6 w-6 mr-2 text-primary" />
              Module Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stats.moduleBreakdown.slice(0, 8).map((module, index) => (
                <div
                  key={`${module.name}-${index}`}
                  className="p-4 rounded-xl border border-border bg-surface-alt"
                  style={{
                    borderLeftColor: module.color,
                    borderLeftWidth: "4px",
                  }}
                >
                  <div className="font-bold text-fg mb-2 truncate">
                    {capitalizeModuleName(module.name)}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Lessons</span>
                      <span className="text-primary font-medium">
                        {module.lessons}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Questions</span>
                      <span className="text-success font-medium">
                        {module.questions}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {stats.moduleBreakdown.length > 8 && (
              <div className="text-muted text-sm mt-4">
                +{stats.moduleBreakdown.length - 8} more modules
              </div>
            )}
          </div>
        </div>

        <div className="glass-card bg-surface-alt border border-border mb-10">
          <h3 className="text-2xl font-bold mb-6 flex items-center text-fg">
            <FireIcon className="h-6 w-6 mr-2 text-warning" />
            Fun Facts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-fg">
                {totalContent.toLocaleString()}
              </div>
              <div className="text-muted">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-fg">
                {totalContent > 0
                  ? Math.round((stats.totalLessons / totalContent) * 100)
                  : 0}
                %
              </div>
              <div className="text-muted">Lessons Share</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-fg">
                {Math.round((stats.averageCompletionTime * totalContent) / 60)}h
              </div>
              <div className="text-muted">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-fg">
                {stats.totalModules}
              </div>
              <div className="text-muted">Modules</div>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <AppProgressTracker />
        </div>

        <div className="text-center text-muted text-sm flex items-center justify-center gap-2">
          <ChartBarIcon className="h-4 w-4" />
          <span>Replace the mock API with your real stats source.</span>
        </div>
      </div>
    </div>
  );
}
