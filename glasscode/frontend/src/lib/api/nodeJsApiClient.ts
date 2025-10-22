/**
 * Node.js Backend API Client
 * Provides a centralized client for interacting with the new Node.js backend API
 */

import { getApiBaseStrict } from '@/lib/urlUtils';
import { isNetworkError } from '@/lib/isNetworkError';

// Define response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Authentication types
interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface AuthResponse {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  token: string;
}

// Profile types
interface ProfileResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  roles: Array<{
    id: number;
    name: string;
    description: string;
  }>;
}

interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  username?: string;
}

// Course types
interface Course {
  id: number;
  title: string;
  description: string;
  slug: string;
  isPublished: boolean;
  order: number;
  difficulty: string;
  estimatedHours: number;
  createdAt: string;
  updatedAt: string;
}

interface CourseListResponse {
  courses: Course[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Module types
interface Module {
  id: number;
  title: string;
  description: string;
  slug: string;
  order: number;
  isPublished: boolean;
  courseId: number;
  createdAt: string;
  updatedAt: string;
}

// Lesson types
interface Lesson {
  id: number;
  title: string;
  slug: string;
  order: number;
  content: Record<string, unknown>;
  metadata: Record<string, unknown>;
  isPublished: boolean;
  difficulty: string;
  estimatedMinutes: number;
  moduleId: number;
  createdAt: string;
  updatedAt: string;
}

// Quiz types
interface QuizQuestion {
  id: number;
  question: string;
  topic?: string;
  difficulty: string;
  choices?: string[];
  fixedChoiceOrder: boolean;
  choiceLabels?: Record<string, unknown>;
  acceptedAnswers?: string[];
  explanation?: string;
  industryContext?: string;
  tags?: string[];
  questionType: string;
  estimatedTime: number;
  correctAnswer: number;
  quizType: string;
  sources?: Record<string, unknown>;
  sortOrder: number;
  isPublished: boolean;
  lessonId: number;
  createdAt: string;
  updatedAt: string;
}

interface QuizSubmissionAnswer {
  quizId: number;
  selectedAnswer?: number;
  userAnswer?: string;
}

interface QuizSubmissionRequest {
  answers: QuizSubmissionAnswer[];
}

interface QuizSubmissionResponse {
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  results: Array<{
    quizId: number;
    isCorrect: boolean;
    correctAnswer: number;
    explanation?: string;
  }>;
}

// Progress types
interface UserProgress {
  id: number;
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  startedAt?: string;
  completedAt?: string;
  userId: number;
  courseId: number;
  createdAt: string;
  updatedAt: string;
}

interface UserLessonProgress {
  id: number;
  isCompleted: boolean;
  timeSpentMinutes: number;
  startedAt?: string;
  completedAt?: string;
  userId: number;
  lessonId: number;
  createdAt: string;
  updatedAt: string;
}

interface ProgressSummary {
  totalCourses: number;
  completedCourses: number;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  courseProgress: UserProgress[];
}

class NodeJsApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    try {
      this.baseUrl = getApiBaseStrict();
    } catch {
      // Fallback to localhost in development
      this.baseUrl = 'http://localhost:8081';
    }
  }

  // Set authentication token
  setAuthToken(token: string): void {
    this.token = token;
  }

  // Clear authentication token
  clearAuthToken(): void {
    this.token = null;
  }

  // Generic fetch helper
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}/api${endpoint}`;
    
    // Set default headers using Headers to support all HeadersInit variants
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    // Add authentication header if token exists
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<T> = await response.json();
      return data;
    } catch (error) {
      if (isNetworkError(error)) {
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: 'Network error occurred. Please check your connection.',
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unknown error occurred',
        },
      };
    }
  }

  // Authentication endpoints
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return this.fetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.fetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async requestPasswordReset(email: string): Promise<ApiResponse<unknown>> {
    return this.fetch<unknown>('/auth/password/request-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<unknown>> {
    return this.fetch<unknown>('/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // Profile endpoints
  async getProfile(): Promise<ApiResponse<ProfileResponse>> {
    return this.fetch<ProfileResponse>('/profile/profile');
  }

  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<ProfileResponse>> {
    return this.fetch<ProfileResponse>('/profile/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Course endpoints
  async getCourses(page = 1, limit = 10): Promise<ApiResponse<CourseListResponse>> {
    return this.fetch<CourseListResponse>(`/courses?page=${page}&limit=${limit}`);
  }

  async getCourseById(id: number): Promise<ApiResponse<Course>> {
    return this.fetch<Course>(`/courses/${id}`);
  }

  // Module endpoints
  async getModulesByCourseId(courseId: number): Promise<ApiResponse<Module[]>> {
    return this.fetch<Module[]>(`/courses/${courseId}/modules`);
  }

  async getModuleById(id: number): Promise<ApiResponse<Module>> {
    return this.fetch<Module>(`/modules/${id}`);
  }

  // Lesson endpoints
  async getLessonsByModuleId(moduleId: number): Promise<ApiResponse<Lesson[]>> {
    return this.fetch<Lesson[]>(`/modules/${moduleId}/lessons`);
  }

  async getLessonById(id: number): Promise<ApiResponse<Lesson>> {
    return this.fetch<Lesson>(`/lessons/${id}`);
  }

  // Quiz endpoints
  async getQuizzesByLessonId(lessonId: number): Promise<ApiResponse<QuizQuestion[]>> {
    return this.fetch<QuizQuestion[]>(`/lessons/${lessonId}/quizzes`);
  }

  async submitQuizAnswers(
    lessonId: number,
    data: QuizSubmissionRequest
  ): Promise<ApiResponse<QuizSubmissionResponse>> {
    return this.fetch<QuizSubmissionResponse>(`/quiz/lessons/${lessonId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Progress endpoints
  async getCourseProgress(courseId: number): Promise<ApiResponse<UserProgress>> {
    return this.fetch<UserProgress>(`/progress/courses/${courseId}`);
  }

  async updateLessonProgress(
    lessonId: number,
    data: Partial<UserLessonProgress>
  ): Promise<ApiResponse<UserLessonProgress>> {
    return this.fetch<UserLessonProgress>(`/progress/lessons/${lessonId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLessonProgress(lessonId: number): Promise<ApiResponse<UserLessonProgress>> {
    return this.fetch<UserLessonProgress>(`/progress/lessons/${lessonId}`);
  }

  async getProgressSummary(): Promise<ApiResponse<ProgressSummary>> {
    return this.fetch<ProgressSummary>('/quiz/summary');
  }
}

// Export singleton instance
export const nodeJsApiClient = new NodeJsApiClient();
export type {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ProfileResponse,
  UpdateProfileRequest,
  Course,
  CourseListResponse,
  Module,
  Lesson,
  QuizQuestion,
  QuizSubmissionRequest,
  QuizSubmissionResponse,
  UserProgress,
  UserLessonProgress,
  ProgressSummary,
};