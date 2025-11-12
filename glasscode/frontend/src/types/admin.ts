export interface AdminModule {
  id: number;
  title: string;
  slug: string;
  description?: string;
  order: number;
  isPublished: boolean;
  courseId?: number;
}

export type LessonDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface AdminLesson {
  id: number;
  title: string;
  slug: string;
  order: number;
  difficulty: LessonDifficulty;
  estimatedMinutes?: number;
  isPublished: boolean;
  moduleId: number;
  content?: string;
  metadata?: string;
}

export type QuestionType =
  | "multiple-choice"
  | "open-ended"
  | "true-false"
  | "coding";

export interface AdminQuiz {
  id: number;
  question: string;
  topic?: string;
  difficulty: LessonDifficulty;
  choices?: string[] | string;
  explanation?: string;
  industryContext?: string;
  tags?: string[] | string;
  questionType: QuestionType;
  estimatedTime?: number;
  correctAnswer?: number | string | null;
  quizType?: string;
  sources?: string[] | string;
  sortOrder?: number;
  isPublished: boolean;
  lessonId: number;
}

export interface AdminCourse {
  id: number;
  title: string;
}
