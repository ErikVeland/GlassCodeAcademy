import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    totalLessons: 128,
    totalQuizzes: 312,
    totalModules: 18,
    totalQuestions: 312,
    averageCompletionTime: 14,
    difficultyBreakdown: {
      beginner: 64,
      intermediate: 48,
      advanced: 16,
    },
    moduleBreakdown: [
      { name: "programming", lessons: 12, questions: 54, color: "#3B82F6" },
      { name: "web", lessons: 15, questions: 55, color: "#10B981" },
      { name: "version", lessons: 10, questions: 20, color: "#8B5CF6" },
      { name: "react", lessons: 14, questions: 30, color: "#F59E0B" },
      { name: "node", lessons: 13, questions: 25, color: "#EF4444" },
      { name: "database", lessons: 11, questions: 24, color: "#06B6D4" },
      { name: "dotnet", lessons: 10, questions: 18, color: "#84CC16" },
      { name: "typescript", lessons: 12, questions: 22, color: "#F97316" },
      { name: "nextjs", lessons: 8, questions: 14, color: "#EC4899" },
      { name: "graphql", lessons: 7, questions: 10, color: "#6366F1" },
    ],
    tierBreakdown: {
      foundational: 80,
      core: 160,
      specialized: 120,
      quality: 80,
    },
    topicDistribution: {
      fundamentals: 42,
      tooling: 18,
      testing: 12,
      performance: 9,
    },
  });
}
