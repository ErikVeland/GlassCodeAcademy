'use client';

import { useState, useEffect, useCallback } from 'react';

import { getGraphQLEndpoint } from '@/lib/urlUtils';
import { contentRegistry } from '@/lib/contentRegistry';
import type { Module, Lesson, ProgrammingQuestion } from '@/lib/contentRegistry';

export interface AppStats {
  totalLessons: number;
  totalQuizzes: number;
  totalModules: number;
  totalQuestions: number;
  averageCompletionTime: number;
  difficultyBreakdown: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  moduleBreakdown: {
    name: string;
    lessons: number;
    questions: number;
    color: string;
  }[];
  tierBreakdown: {
    foundational: number;
    core: number;
    specialized: number;
    quality: number;
  };
  topicDistribution: {
    [key: string]: number;
  };
  isLoading: boolean;
  error: string | null;
}

// Base type for registry fallback results
type BaseStats = Omit<AppStats, 'isLoading' | 'error'>;

async function buildStatsFromRegistry(): Promise<BaseStats> {
  // Load modules from content registry
  const modules: Module[] = await contentRegistry.getModules();

  const moduleColors = [
    '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
    '#14B8A6', '#F59E0B', '#8B5CF6', '#EF4444', '#10B981',
    '#3B82F6', '#F97316'
  ];

  let totalLessons = 0;
  let totalQuestions = 0;
  let totalTime = 0;

  const moduleBreakdown: { name: string; lessons: number; questions: number; color: string }[] = [];
  const topicDistribution: { [key: string]: number } = {};
  const difficultyBreakdown = { beginner: 0, intermediate: 0, advanced: 0 };
  const tierBreakdown = { foundational: 0, core: 0, specialized: 0, quality: 0 };

  await Promise.all(
    modules.map(async (mod, i) => {
      const [lessons, quiz] = await Promise.all([
        contentRegistry.getModuleLessons(mod.slug),
        contentRegistry.getModuleQuiz(mod.slug),
      ]);

      const lessonCount = lessons.length;
      const questionCount = quiz?.questions?.length || 0;

      // Aggregate module-level stats
      moduleBreakdown.push({
        name: mod.title || mod.slug,
        lessons: lessonCount,
        questions: questionCount,
        color: moduleColors[i % moduleColors.length],
      });

      // Tier breakdown counts by module contributions
      const tierKey = (mod.tier || '').toLowerCase();
      if (tierKey && (tierKey in tierBreakdown)) {
        // Count contributions as sum of lessons + questions in the module
        tierBreakdown[tierKey as keyof typeof tierBreakdown] += lessonCount + questionCount;
      }

      // Difficulty breakdown (use module-level difficulty for lessons)
      const moduleDifficulty = (mod.difficulty || '').toLowerCase();
      if (moduleDifficulty === 'beginner') difficultyBreakdown.beginner += lessonCount;
      else if (moduleDifficulty === 'intermediate') difficultyBreakdown.intermediate += lessonCount;
      else if (moduleDifficulty === 'advanced') difficultyBreakdown.advanced += lessonCount;

      // Aggregate lesson topics and time
      lessons.forEach((l: Lesson) => {
        if (l.topic) {
          topicDistribution[l.topic] = (topicDistribution[l.topic] || 0) + 1;
        }
        totalTime += l.estimatedMinutes || 0;
      });

      // Aggregate quiz topics
      quiz?.questions?.forEach((q: ProgrammingQuestion) => {
        if (q.topic) {
          topicDistribution[q.topic] = (topicDistribution[q.topic] || 0) + 1;
        }
      });

      totalLessons += lessonCount;
      totalQuestions += questionCount;
    })
  );

  const averageCompletionTime = (totalLessons + totalQuestions) > 0
    ? Math.round(totalTime / (totalLessons + totalQuestions))
    : 0;

  const totalModules = modules.length;

  return {
    totalLessons,
    totalQuizzes: totalQuestions,
    totalModules,
    totalQuestions,
    averageCompletionTime,
    difficultyBreakdown,
    moduleBreakdown,
    tierBreakdown,
    topicDistribution,
  };
}

export function useAppStats(): AppStats {
  const [stats, setStats] = useState<AppStats>({
    totalLessons: 0,
    totalQuizzes: 0,
    totalModules: 0,
    totalQuestions: 0,
    averageCompletionTime: 0,
    difficultyBreakdown: {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
    },
    moduleBreakdown: [],
    tierBreakdown: {
      foundational: 0,
      core: 0,
      specialized: 0,
      quality: 0,
    },
    topicDistribution: {},
    isLoading: true,
    error: null,
  });

  // Memoize the fetchStats function to prevent unnecessary re-renders
  const fetchStats = useCallback(async () => {
    try {
      setStats(prev => ({ ...prev, isLoading: true, error: null }));

      // Fetch data from multiple GraphQL queries
      const queries = [
        // Lessons
        { query: '{ dotNetLessons { id title estimatedMinutes difficulty topic } }' },
        { query: '{ graphQLLessons { id title estimatedMinutes difficulty topic } }' },
        { query: '{ laravelLessons { id title estimatedMinutes difficulty topic } }' },
        { query: '{ reactLessons { id title estimatedMinutes difficulty topic } }' },
        { query: '{ tailwindLessons { id title estimatedMinutes difficulty topic } }' },
        { query: '{ nodeLessons { id title estimatedMinutes difficulty topic } }' },
        { query: '{ sassLessons { id title estimatedMinutes difficulty topic } }' },
        { query: '{ vueLessons { id title estimatedMinutes difficulty topic } }' },
        { query: '{ typescriptLessons { id title estimatedMinutes difficulty topic } }' },
        { query: '{ databaseLessons { id title estimatedMinutes difficulty topic } }' },
        { query: '{ testingLessons { id title estimatedMinutes difficulty topic } }' },
        { query: '{ programmingLessons { id title estimatedMinutes difficulty topic } }' },
        { query: '{ webLessons { id title estimatedMinutes difficulty topic } }' },
        { query: '{ nextJsLessons { id title estimatedMinutes difficulty topic } }' },
        { query: '{ performanceLessons { id title estimatedMinutes difficulty topic } }' },
        { query: '{ securityLessons { id title estimatedMinutes difficulty topic } }' },
        { query: '{ versionLessons { id title estimatedMinutes difficulty topic } }' },
        
        // Questions
        { query: '{ dotNetInterviewQuestions { id question difficulty topic estimatedTime } }' },
        { query: '{ graphQLInterviewQuestions { id question difficulty topic estimatedTime } }' },
        { query: '{ laravelInterviewQuestions { id question difficulty topic estimatedTime } }' },
        { query: '{ reactInterviewQuestions { id question difficulty topic estimatedTime } }' },
        { query: '{ tailwindInterviewQuestions { id question difficulty topic estimatedTime } }' },
        { query: '{ nodeInterviewQuestions { id question difficulty topic estimatedTime } }' },
        { query: '{ sassInterviewQuestions { id question difficulty topic estimatedTime } }' },
        { query: '{ vueInterviewQuestions { id question difficulty topic estimatedTime } }' },
        { query: '{ typescriptInterviewQuestions { id question difficulty topic estimatedTime } }' },
        { query: '{ databaseInterviewQuestions { id question difficulty topic estimatedTime } }' },
        { query: '{ testingInterviewQuestions { id question difficulty topic estimatedTime } }' },
        { query: '{ programmingInterviewQuestions { id question difficulty topic estimatedTime } }' },
        { query: '{ webInterviewQuestions { id question difficulty topic estimatedTime } }' },
        { query: '{ nextJsInterviewQuestions { id question difficulty topic estimatedTime } }' },
        { query: '{ performanceInterviewQuestions { id question difficulty topic estimatedTime } }' },
        { query: '{ securityInterviewQuestions { id question difficulty topic estimatedTime } }' },
        { query: '{ versionInterviewQuestions { id question difficulty topic estimatedTime } }' },
      ];

      // Add timeout and limit concurrent requests to prevent UI lockup
      const responses = await Promise.all(
        queries.map(async ({ query }) => {
          // Add timeout to prevent hanging requests
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          try {
            const response = await fetch(getGraphQLEndpoint(), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ query }),
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return response.json();
          } catch (error) {
            clearTimeout(timeoutId);
            // Return empty data on error to prevent complete failure
            return { data: null, error: error instanceof Error ? error.message : 'Unknown error' } as { data: unknown; error?: string };
          }
        })
      );

      type GqlResponse = { data?: unknown; error?: string };

      // Prepare accumulators and visualization palette
      interface LessonItem {
        id: string;
        title: string;
        estimatedMinutes?: number;
        difficulty?: string;
        topic?: string;
      }
      interface QuestionItem {
        id: string;
        question: string;
        difficulty?: string;
        topic?: string;
        estimatedTime?: number;
      }
      let allLessons: LessonItem[] = [];
      let allQuestions: QuestionItem[] = [];
      const moduleStats: { [key: string]: { lessons: number; questions: number; color: string } } = {};
      const moduleColors = [
        '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
        '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
        '#14B8A6', '#F59E0B', '#8B5CF6', '#EF4444', '#10B981',
        '#3B82F6', '#F97316'
      ];

      responses.forEach((response) => {
        const r = response as GqlResponse;
        if (r.error || !r.data || typeof r.data !== 'object') return;

        const dataObj = r.data as object;
        const keys = Object.keys(dataObj as Record<string, unknown>);
        if (keys.length === 0) return;
        const key = keys[0];
        const itemsUnknown = (dataObj as Record<string, unknown>)[key];
        if (!Array.isArray(itemsUnknown)) return;

        const moduleName = key.replace(/Lessons|InterviewQuestions/g, '').replace(/([A-Z])/g, ' $1').trim();
        
        if (!moduleStats[moduleName]) {
          moduleStats[moduleName] = { 
            lessons: 0, 
            questions: 0, 
            color: moduleColors[Object.keys(moduleStats).length % moduleColors.length] 
          };
        }

        if (key.includes('Lessons')) {
          const lessonItems = (itemsUnknown as unknown[]).map(i => i as LessonItem);
          allLessons = [...allLessons, ...lessonItems];
          moduleStats[moduleName].lessons = lessonItems.length;
        } else if (key.includes('Questions')) {
          const questionItems = (itemsUnknown as unknown[]).map(i => i as QuestionItem);
          allQuestions = [...allQuestions, ...questionItems];
          moduleStats[moduleName].questions = questionItems.length;
        }
      });

      // Calculate statistics
      const totalLessons = allLessons.length;
      const totalQuestions = allQuestions.length;
      const totalModules = Object.keys(moduleStats).length;

      // Difficulty breakdown
      const difficultyBreakdown = {
        beginner: 0,
        intermediate: 0,
        advanced: 0,
      };

      [...allLessons, ...allQuestions].forEach(item => {
        const difficulty = item.difficulty?.toLowerCase();
        if (difficulty === 'beginner') difficultyBreakdown.beginner++;
        else if (difficulty === 'intermediate') difficultyBreakdown.intermediate++;
        else if (difficulty === 'advanced') difficultyBreakdown.advanced++;
      });

      // Average completion time
      const totalTime = allLessons.reduce((sum, lesson) => sum + (lesson.estimatedMinutes || 0), 0) +
                       allQuestions.reduce((sum, question) => sum + ((question.estimatedTime || 0) / 60), 0);
      const averageCompletionTime = totalLessons + totalQuestions > 0 
        ? Math.round(totalTime / (totalLessons + totalQuestions)) 
        : 0;

      // Module breakdown
      const moduleBreakdown = Object.entries(moduleStats).map(([name, stats]) => ({
        name,
        lessons: stats.lessons,
        questions: stats.questions,
        color: stats.color,
      }));

      // Topic distribution
      const topicDistribution: { [key: string]: number } = {};
      [...allLessons, ...allQuestions].forEach(item => {
        if (item.topic) {
          topicDistribution[item.topic] = (topicDistribution[item.topic] || 0) + 1;
        }
      });

      // Tier breakdown (based on actual module names)
      const tierBreakdown = {
        foundational: moduleBreakdown.filter(m => 
          ['web', 'programming', 'version'].includes(m.name.toLowerCase())
        ).reduce((sum, m) => sum + m.lessons + m.questions, 0),
        core: moduleBreakdown.filter(m => 
          ['react', 'laravel', 'database', 'node'].includes(m.name.toLowerCase())
        ).reduce((sum, m) => sum + m.lessons + m.questions, 0),
        specialized: moduleBreakdown.filter(m => 
          ['next js', 'graph q l', 'vue', 'typescript'].includes(m.name.toLowerCase())
        ).reduce((sum, m) => sum + m.lessons + m.questions, 0),
        quality: moduleBreakdown.filter(m => 
          ['testing', 'performance', 'security'].includes(m.name.toLowerCase())
        ).reduce((sum, m) => sum + m.lessons + m.questions, 0),
      };

      // If GraphQL produced no data, fall back to registry-based stats
      if (totalModules === 0 && totalLessons === 0 && totalQuestions === 0) {
        const fallback = await buildStatsFromRegistry();
        setStats({
          ...fallback,
          isLoading: false,
          error: null,
        });
        return;
      }

      setStats({
        totalLessons,
        totalQuizzes: totalQuestions, // Using questions as quiz indicator
        totalModules,
        totalQuestions,
        averageCompletionTime,
        difficultyBreakdown,
        moduleBreakdown,
        tierBreakdown,
        topicDistribution,
        isLoading: false,
        error: null,
      });

    } catch (error) {
      console.error('Error fetching app stats:', error);
      // Attempt registry fallback on error
      try {
        const fallback = await buildStatsFromRegistry();
        setStats({
          ...fallback,
          isLoading: false,
          error: null,
        });
      } catch {
        setStats(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch stats',
        }));
      }
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return stats;
}