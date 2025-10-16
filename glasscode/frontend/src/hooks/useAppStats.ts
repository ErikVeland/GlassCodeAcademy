'use client';

import { useState, useEffect } from 'react';

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

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:5022/api';

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

  useEffect(() => {
    async function fetchStats() {
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

        const responses = await Promise.all(
          queries.map(async ({ query }) => {
            const response = await fetch(GRAPHQL_ENDPOINT, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ query }),
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return response.json();
          })
        );

        // Process the data
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

        // Module colors for visualization
        const moduleColors = [
          '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
          '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
          '#14B8A6', '#F59E0B', '#8B5CF6', '#EF4444', '#10B981',
          '#3B82F6', '#F97316'
        ];

        responses.forEach((response) => {
          if (response.data) {
            const data = response.data;
            const key = Object.keys(data)[0];
            const items = data[key] || [];
            
            const moduleName = key.replace(/Lessons|InterviewQuestions/g, '').replace(/([A-Z])/g, ' $1').trim();
            
            if (!moduleStats[moduleName]) {
              moduleStats[moduleName] = { 
                lessons: 0, 
                questions: 0, 
                color: moduleColors[Object.keys(moduleStats).length % moduleColors.length] 
              };
            }

            if (key.includes('Lessons')) {
              allLessons = [...allLessons, ...items];
              moduleStats[moduleName].lessons = items.length;
            } else if (key.includes('Questions')) {
              allQuestions = [...allQuestions, ...items];
              moduleStats[moduleName].questions = items.length;
            }
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
                         allQuestions.reduce((sum, question) => sum + (question.estimatedTime || 0) / 60, 0);
        const averageCompletionTime = Math.round(totalTime / (totalLessons + totalQuestions));

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
        setStats(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch stats',
        }));
      }
    }

    fetchStats();
  }, []);

  return stats;
}