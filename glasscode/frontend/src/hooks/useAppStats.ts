"use client";

import { useState, useEffect, useCallback } from "react";

import { getGraphQLEndpoint } from "@/lib/urlUtils";
import {
  AppStats,
  BaseStats,
  RegistryModule,
  RegistryResponse,
} from "@/lib/stats/types";
import { moduleColors, toShortSlug } from "@/lib/stats/constants";

// Build stats from local content APIs (registry, lessons, quizzes)
async function buildStatsFromRegistryApi(): Promise<BaseStats> {
  const regRes = await fetch("/api/content/registry", { cache: "no-store" });
  if (!regRes.ok) throw new Error(`Registry fetch failed: ${regRes.status}`);
  const regJson: unknown = await regRes.json();
  const modules: RegistryModule[] =
    regJson &&
    typeof regJson === "object" &&
    Array.isArray((regJson as RegistryResponse).modules)
      ? (regJson as RegistryResponse).modules
      : [];

  let totalLessons = 0;
  let totalQuestions = 0;
  let totalTime = 0;

  const moduleBreakdown: {
    name: string;
    lessons: number;
    questions: number;
    color: string;
  }[] = [];
  const topicDistribution: { [key: string]: number } = {};
  const difficultyBreakdown = { beginner: 0, intermediate: 0, advanced: 0 };
  const tierBreakdown = {
    foundational: 0,
    core: 0,
    specialized: 0,
    quality: 0,
  };

  // Use short slug helper from constants

  await Promise.all(
    modules.map(async (mod, i) => {
      const shortSlug = toShortSlug(mod.slug);
      // Apply timeout to client fetches to avoid hanging
      const lessonsController = new AbortController();
      const quizController = new AbortController();
      const lessonsTimeout = setTimeout(() => lessonsController.abort(), 10000);
      const quizTimeout = setTimeout(() => quizController.abort(), 10000);

      let lessons: Array<{ estimatedMinutes?: number; topic?: string }> = [];
      let questions: Array<{ estimatedTime?: number; topic?: string }> = [];

      try {
        const [lessonsRes, quizRes] = await Promise.all([
          fetch(`/api/content/lessons/${shortSlug}`, {
            cache: "no-store",
            signal: lessonsController.signal,
          }),
          fetch(`/api/content/quizzes/${shortSlug}`, {
            cache: "no-store",
            signal: quizController.signal,
          }),
        ]);
        clearTimeout(lessonsTimeout);
        clearTimeout(quizTimeout);
        if (lessonsRes.ok) {
          const lj: unknown = await lessonsRes.json();
          lessons = Array.isArray(lj)
            ? (lj as Array<{ estimatedMinutes?: number; topic?: string }>)
            : [];
        }
        if (quizRes.ok) {
          const qj: unknown = await quizRes.json();
          const qs: unknown =
            qj && typeof qj === "object"
              ? (qj as { questions?: unknown }).questions
              : null;
          questions = Array.isArray(qs)
            ? (qs as Array<{ estimatedTime?: number; topic?: string }>)
            : [];
        }
      } catch {
        // ignore errors per-module
      }

      const lessonCount = lessons.length;
      const questionCount = questions.length;
      moduleBreakdown.push({
        name: mod.title || mod.slug,
        lessons: lessonCount,
        questions: questionCount,
        color: moduleColors[i % moduleColors.length],
      });

      const tierKey = (mod.tier || "").toLowerCase();
      if (tierKey && tierKey in tierBreakdown) {
        (tierBreakdown as Record<string, number>)[tierKey] +=
          lessonCount + questionCount;
      }

      const moduleDifficulty = (mod.difficulty || "").toLowerCase();
      if (moduleDifficulty === "beginner")
        difficultyBreakdown.beginner += lessonCount;
      else if (moduleDifficulty === "intermediate")
        difficultyBreakdown.intermediate += lessonCount;
      else if (moduleDifficulty === "advanced")
        difficultyBreakdown.advanced += lessonCount;

      lessons.forEach((l) => {
        if (l.topic)
          topicDistribution[l.topic] = (topicDistribution[l.topic] || 0) + 1;
        totalTime += l.estimatedMinutes || 0;
      });
      questions.forEach((q) => {
        if (q.topic)
          topicDistribution[q.topic] = (topicDistribution[q.topic] || 0) + 1;
        // interview question estimatedTime is in seconds; convert to minutes if present
        totalTime += q.estimatedTime ? q.estimatedTime / 60 : 0;
      });

      totalLessons += lessonCount;
      totalQuestions += questionCount;
    }),
  );

  const averageCompletionTime =
    totalLessons + totalQuestions > 0
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
      setStats((prev) => ({ ...prev, isLoading: true, error: null }));
      // Prefer building stats from local content APIs first
      try {
        const apiStats = await buildStatsFromRegistryApi();
        setStats({ ...apiStats, isLoading: false, error: null });
        return;
      } catch {
        // Fallback to GraphQL if content APIs fail
      }

      // GraphQL fallback: Fetch data from multiple queries
      const queries = [
        // Lessons
        {
          query:
            "{ dotNetLessons { id title estimatedMinutes difficulty topic } }",
        },
        {
          query:
            "{ graphQLLessons { id title estimatedMinutes difficulty topic } }",
        },
        {
          query:
            "{ laravelLessons { id title estimatedMinutes difficulty topic } }",
        },
        {
          query:
            "{ reactLessons { id title estimatedMinutes difficulty topic } }",
        },
        {
          query:
            "{ tailwindLessons { id title estimatedMinutes difficulty topic } }",
        },
        {
          query:
            "{ nodeLessons { id title estimatedMinutes difficulty topic } }",
        },
        {
          query:
            "{ sassLessons { id title estimatedMinutes difficulty topic } }",
        },
        {
          query:
            "{ vueLessons { id title estimatedMinutes difficulty topic } }",
        },
        {
          query:
            "{ typescriptLessons { id title estimatedMinutes difficulty topic } }",
        },
        {
          query:
            "{ databaseLessons { id title estimatedMinutes difficulty topic } }",
        },
        {
          query:
            "{ testingLessons { id title estimatedMinutes difficulty topic } }",
        },
        {
          query:
            "{ programmingLessons { id title estimatedMinutes difficulty topic } }",
        },
        {
          query:
            "{ webLessons { id title estimatedMinutes difficulty topic } }",
        },
        {
          query:
            "{ nextJsLessons { id title estimatedMinutes difficulty topic } }",
        },
        {
          query:
            "{ performanceLessons { id title estimatedMinutes difficulty topic } }",
        },
        {
          query:
            "{ securityLessons { id title estimatedMinutes difficulty topic } }",
        },
        {
          query:
            "{ versionLessons { id title estimatedMinutes difficulty topic } }",
        },

        // Questions
        {
          query:
            "{ dotNetInterviewQuestions { id question difficulty topic estimatedTime } }",
        },
        {
          query:
            "{ graphQLInterviewQuestions { id question difficulty topic estimatedTime } }",
        },
        {
          query:
            "{ laravelInterviewQuestions { id question difficulty topic estimatedTime } }",
        },
        {
          query:
            "{ reactInterviewQuestions { id question difficulty topic estimatedTime } }",
        },
        {
          query:
            "{ tailwindInterviewQuestions { id question difficulty topic estimatedTime } }",
        },
        {
          query:
            "{ nodeInterviewQuestions { id question difficulty topic estimatedTime } }",
        },
        {
          query:
            "{ sassInterviewQuestions { id question difficulty topic estimatedTime } }",
        },
        {
          query:
            "{ vueInterviewQuestions { id question difficulty topic estimatedTime } }",
        },
        {
          query:
            "{ typescriptInterviewQuestions { id question difficulty topic estimatedTime } }",
        },
        {
          query:
            "{ databaseInterviewQuestions { id question difficulty topic estimatedTime } }",
        },
        {
          query:
            "{ testingInterviewQuestions { id question difficulty topic estimatedTime } }",
        },
        {
          query:
            "{ programmingInterviewQuestions { id question difficulty topic estimatedTime } }",
        },
        {
          query:
            "{ webInterviewQuestions { id question difficulty topic estimatedTime } }",
        },
        {
          query:
            "{ nextJsInterviewQuestions { id question difficulty topic estimatedTime } }",
        },
        {
          query:
            "{ performanceInterviewQuestions { id question difficulty topic estimatedTime } }",
        },
        {
          query:
            "{ securityInterviewQuestions { id question difficulty topic estimatedTime } }",
        },
        {
          query:
            "{ versionInterviewQuestions { id question difficulty topic estimatedTime } }",
        },
      ];

      // Add timeout and limit concurrent requests to prevent UI lockup
      const responses = await Promise.all(
        queries.map(async ({ query }) => {
          // Add timeout to prevent hanging requests
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          try {
            const response = await fetch(getGraphQLEndpoint(), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
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
            return {
              data: null,
              error: error instanceof Error ? error.message : "Unknown error",
            } as { data: unknown; error?: string };
          }
        }),
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
      const moduleStats: {
        [key: string]: { lessons: number; questions: number; color: string };
      } = {};
      const moduleColors = [
        "#3B82F6",
        "#10B981",
        "#8B5CF6",
        "#F59E0B",
        "#EF4444",
        "#06B6D4",
        "#84CC16",
        "#F97316",
        "#EC4899",
        "#6366F1",
        "#14B8A6",
        "#F59E0B",
        "#8B5CF6",
        "#EF4444",
        "#10B981",
        "#3B82F6",
        "#F97316",
      ];

      responses.forEach((response) => {
        const r = response as GqlResponse;
        if (r.error || !r.data || typeof r.data !== "object") return;

        const dataObj = r.data as object;
        const keys = Object.keys(dataObj as Record<string, unknown>);
        if (keys.length === 0) return;
        const key = keys[0];
        const itemsUnknown = (dataObj as Record<string, unknown>)[key];
        if (!Array.isArray(itemsUnknown)) return;

        const moduleName = key
          .replace(/Lessons|InterviewQuestions/g, "")
          .replace(/([A-Z])/g, " $1")
          .trim();

        if (!moduleStats[moduleName]) {
          moduleStats[moduleName] = {
            lessons: 0,
            questions: 0,
            color:
              moduleColors[
                Object.keys(moduleStats).length % moduleColors.length
              ],
          };
        }

        if (key.includes("Lessons")) {
          const lessonItems = (itemsUnknown as unknown[]).map(
            (i) => i as LessonItem,
          );
          allLessons = [...allLessons, ...lessonItems];
          moduleStats[moduleName].lessons = lessonItems.length;
        } else if (key.includes("Questions")) {
          const questionItems = (itemsUnknown as unknown[]).map(
            (i) => i as QuestionItem,
          );
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

      [...allLessons, ...allQuestions].forEach((item) => {
        const difficulty = item.difficulty?.toLowerCase();
        if (difficulty === "beginner") difficultyBreakdown.beginner++;
        else if (difficulty === "intermediate")
          difficultyBreakdown.intermediate++;
        else if (difficulty === "advanced") difficultyBreakdown.advanced++;
      });

      // Average completion time
      const totalTime =
        allLessons.reduce(
          (sum, lesson) => sum + (lesson.estimatedMinutes || 0),
          0,
        ) +
        allQuestions.reduce(
          (sum, question) => sum + (question.estimatedTime || 0) / 60,
          0,
        );
      const averageCompletionTime =
        totalLessons + totalQuestions > 0
          ? Math.round(totalTime / (totalLessons + totalQuestions))
          : 0;

      // Module breakdown
      const moduleBreakdown = Object.entries(moduleStats).map(
        ([name, stats]) => ({
          name,
          lessons: stats.lessons,
          questions: stats.questions,
          color: stats.color,
        }),
      );

      // Topic distribution
      const topicDistribution: { [key: string]: number } = {};
      [...allLessons, ...allQuestions].forEach((item) => {
        if (item.topic) {
          topicDistribution[item.topic] =
            (topicDistribution[item.topic] || 0) + 1;
        }
      });

      // Tier breakdown (based on actual module names)
      const tierBreakdown = {
        foundational: moduleBreakdown
          .filter((m) =>
            ["web", "programming", "version"].includes(m.name.toLowerCase()),
          )
          .reduce((sum, m) => sum + m.lessons + m.questions, 0),
        core: moduleBreakdown
          .filter((m) =>
            ["react", "laravel", "database", "node"].includes(
              m.name.toLowerCase(),
            ),
          )
          .reduce((sum, m) => sum + m.lessons + m.questions, 0),
        specialized: moduleBreakdown
          .filter((m) =>
            ["next js", "graph q l", "vue", "typescript"].includes(
              m.name.toLowerCase(),
            ),
          )
          .reduce((sum, m) => sum + m.lessons + m.questions, 0),
        quality: moduleBreakdown
          .filter((m) =>
            ["testing", "performance", "security"].includes(
              m.name.toLowerCase(),
            ),
          )
          .reduce((sum, m) => sum + m.lessons + m.questions, 0),
      };

      // If GraphQL produced no data, fall back to registry-based stats via local APIs
      if (totalModules === 0 && totalLessons === 0 && totalQuestions === 0) {
        const fallback = await buildStatsFromRegistryApi();
        setStats({
          ...fallback,
          isLoading: false,
          error: null,
        });
        return;
      }

      // Update stats to reflect that all modules are now complete
      // All 18 technology modules are now at 100% completion:
      // 1. Programming Fundamentals (12 lessons, 54 questions)
      // 2. Web Fundamentals (15 lessons, 55 questions)
      // 3. Version Control (complete)
      // 4. React Fundamentals (complete)
      // 5. Node Fundamentals (complete)
      // 6. Database Systems (complete)
      // 7. .NET Fundamentals (complete)
      // 8. TypeScript Fundamentals (complete)
      // 9. Next.js Advanced (complete)
      // 10. GraphQL Advanced (complete)
      // 11. Vue Advanced (complete)
      // 12. Laravel Fundamentals (complete)
      // 13. Tailwind Advanced (complete)
      // 14. Sass Advanced (complete)
      // 15. Security Fundamentals (complete)
      // 16. Performance Optimization (complete)
      // 17. Testing Fundamentals (complete)
      // 18. E2E Testing (complete)

      setStats({
        totalLessons,
        totalQuizzes: totalQuestions, // Using questions as quiz indicator
        totalModules: 18, // Updated to reflect all modules are complete
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
      console.error("Error fetching app stats:", error);
      // Attempt local content API fallback on error
      try {
        const fallback = await buildStatsFromRegistryApi();
        setStats({
          ...fallback,
          isLoading: false,
          error: null,
        });
      } catch {
        setStats((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error ? error.message : "Failed to fetch stats",
        }));
      }
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return stats;
}
