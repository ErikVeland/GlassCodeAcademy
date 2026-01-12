/**
 * Tests for React Hooks
 */

import { renderHook, act } from "@testing-library/react";
import * as nodeJsApiClient from "../nodeJsApiClient";
import {
  useAuth,
  useCourses,
  useCourse,
  useModules,
  useLessons,
  useQuizzes,
  useQuizSubmission,
  useCourseProgress,
  useLessonProgress,
  useProgressSummary,
} from "../hooks";

// Mock the nodeJsApiClient
jest.mock("../nodeJsApiClient");

describe("React Hooks", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("useAuth", () => {
    it("should login a user", async () => {
      const mockLoginResponse = {
        success: true,
        data: {
          user: {
            id: 1,
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
          },
          token: "mock-token",
        },
      };

      (nodeJsApiClient.nodeJsApiClient.login as jest.Mock).mockResolvedValue(
        mockLoginResponse,
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const loginResult = await result.current.login(
          "test@example.com",
          "password123",
        );
        expect(loginResult).toEqual({
          success: true,
          data: mockLoginResult.data,
        });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockLoginResponse.data.user);
    });

    it("should register a user", async () => {
      const mockRegisterResponse = {
        success: true,
        data: {
          user: {
            id: 1,
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
          },
          token: "mock-token",
        },
      };

      (nodeJsApiClient.nodeJsApiClient.register as jest.Mock).mockResolvedValue(
        mockRegisterResponse,
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const registerResult = await result.current.register(
          "test@example.com",
          "password123",
          "Test",
          "User",
        );
        expect(registerResult).toEqual({
          success: true,
          data: mockRegisterResult.data,
        });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockRegisterResponse.data.user);
    });

    it("should logout a user", async () => {
      const mockLoginResponse = {
        success: true,
        data: {
          user: {
            id: 1,
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
          },
          token: "mock-token",
        },
      };

      (nodeJsApiClient.nodeJsApiClient.login as jest.Mock).mockResolvedValue(
        mockLoginResponse,
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe("useCourses", () => {
    it("should fetch courses", async () => {
      const mockCoursesResponse = {
        success: true,
        data: {
          courses: [
            {
              id: 1,
              title: "Test Course",
              description: "A test course",
              slug: "test-course",
              isPublished: true,
              order: 1,
              difficulty: "Beginner",
              estimatedHours: 10,
              createdAt: "2023-01-01T00:00:00Z",
              updatedAt: "2023-01-01T00:00:00Z",
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            pages: 1,
          },
        },
      };

      (
        nodeJsApiClient.nodeJsApiClient.getCourses as jest.Mock
      ).mockResolvedValue(mockCoursesResponse);

      const { result } = renderHook(() => useCourses(1, 10));

      expect(result.current.loading).toBe(true);

      // Wait for the hook to finish loading
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.courses).toEqual(mockCoursesResponse.data.courses);
      expect(result.current.pagination).toEqual(
        mockCoursesResponse.data.pagination,
      );
    });
  });

  describe("useCourse", () => {
    it("should fetch a course by ID", async () => {
      const mockCourseResponse = {
        success: true,
        data: {
          id: 1,
          title: "Test Course",
          description: "A test course",
          slug: "test-course",
          isPublished: true,
          order: 1,
          difficulty: "Beginner",
          estimatedHours: 10,
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
        },
      };

      (
        nodeJsApiClient.nodeJsApiClient.getCourseById as jest.Mock
      ).mockResolvedValue(mockCourseResponse);

      const { result } = renderHook(() => useCourse(1));

      expect(result.current.loading).toBe(true);

      // Wait for the hook to finish loading
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.course).toEqual(mockCourseResponse.data);
    });
  });

  describe("useModules", () => {
    it("should fetch modules by course ID", async () => {
      const mockModulesResponse = {
        success: true,
        data: [
          {
            id: 1,
            title: "Test Module",
            description: "A test module",
            slug: "test-module",
            order: 1,
            isPublished: true,
            courseId: 1,
            createdAt: "2023-01-01T00:00:00Z",
            updatedAt: "2023-01-01T00:00:00Z",
          },
        ],
      };

      (
        nodeJsApiClient.nodeJsApiClient.getModulesByCourseId as jest.Mock
      ).mockResolvedValue(mockModulesResponse);

      const { result } = renderHook(() => useModules(1));

      expect(result.current.loading).toBe(true);

      // Wait for the hook to finish loading
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.modules).toEqual(mockModulesResponse.data);
    });
  });

  describe("useLessons", () => {
    it("should fetch lessons by module ID", async () => {
      const mockLessonsResponse = {
        success: true,
        data: [
          {
            id: 1,
            title: "Test Lesson",
            slug: "test-lesson",
            order: 1,
            content: {},
            metadata: {},
            isPublished: true,
            difficulty: "Beginner",
            estimatedMinutes: 30,
            moduleId: 1,
            createdAt: "2023-01-01T00:00:00Z",
            updatedAt: "2023-01-01T00:00:00Z",
          },
        ],
      };

      (
        nodeJsApiClient.nodeJsApiClient.getLessonsByModuleId as jest.Mock
      ).mockResolvedValue(mockLessonsResponse);

      const { result } = renderHook(() => useLessons(1));

      expect(result.current.loading).toBe(true);

      // Wait for the hook to finish loading
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.lessons).toEqual(mockLessonsResponse.data);
    });
  });

  describe("useQuizzes", () => {
    it("should fetch quizzes by lesson ID", async () => {
      const mockQuizzesResponse = {
        success: true,
        data: [
          {
            id: 1,
            question: "Test question?",
            topic: "test",
            difficulty: "Beginner",
            choices: ["A", "B", "C", "D"],
            fixedChoiceOrder: false,
            questionType: "multiple-choice",
            estimatedTime: 90,
            correctAnswer: 0,
            quizType: "multiple-choice",
            sortOrder: 1,
            isPublished: true,
            lessonId: 1,
            createdAt: "2023-01-01T00:00:00Z",
            updatedAt: "2023-01-01T00:00:00Z",
          },
        ],
      };

      (
        nodeJsApiClient.nodeJsApiClient.getQuizzesByLessonId as jest.Mock
      ).mockResolvedValue(mockQuizzesResponse);

      const { result } = renderHook(() => useQuizzes(1));

      expect(result.current.loading).toBe(true);

      // Wait for the hook to finish loading
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.quizzes).toEqual(mockQuizzesResponse.data);
    });
  });

  describe("useQuizSubmission", () => {
    it("should submit quiz answers", async () => {
      const mockSubmissionResponse = {
        success: true,
        data: {
          totalQuestions: 1,
          correctAnswers: 1,
          scorePercentage: 100,
          results: [
            {
              quizId: 1,
              isCorrect: true,
              correctAnswer: 0,
              explanation: "Correct!",
            },
          ],
        },
      };

      const submissionData = {
        answers: [
          {
            quizId: 1,
            selectedAnswer: 0,
          },
        ],
      };

      (
        nodeJsApiClient.nodeJsApiClient.submitQuizAnswers as jest.Mock
      ).mockResolvedValue(mockSubmissionResponse);

      const { result } = renderHook(() => useQuizSubmission());

      expect(result.current.loading).toBe(false);

      await act(async () => {
        const submitResult = await result.current.submitQuiz(1, submissionData);
        expect(submitResult).toEqual({
          success: true,
          data: mockSubmissionResult.data,
        });
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.result).toEqual(mockSubmissionResponse.data);
    });
  });

  describe("useCourseProgress", () => {
    it("should fetch course progress", async () => {
      const mockProgressResponse = {
        success: true,
        data: {
          id: 1,
          completedLessons: 5,
          totalLessons: 10,
          progressPercentage: 50,
          userId: 1,
          courseId: 1,
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
        },
      };

      (
        nodeJsApiClient.nodeJsApiClient.getCourseProgress as jest.Mock
      ).mockResolvedValue(mockProgressResponse);

      const { result } = renderHook(() => useCourseProgress(1));

      expect(result.current.loading).toBe(true);

      // Wait for the hook to finish loading
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.progress).toEqual(mockProgressResponse.data);
    });
  });

  describe("useLessonProgress", () => {
    it("should fetch lesson progress", async () => {
      const mockProgressResponse = {
        success: true,
        data: {
          id: 1,
          isCompleted: true,
          timeSpentMinutes: 30,
          userId: 1,
          lessonId: 1,
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
        },
      };

      (
        nodeJsApiClient.nodeJsApiClient.getLessonProgress as jest.Mock
      ).mockResolvedValue(mockProgressResponse);

      const { result } = renderHook(() => useLessonProgress(1));

      expect(result.current.loading).toBe(true);

      // Wait for the hook to finish loading
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.progress).toEqual(mockProgressResponse.data);
    });

    it("should update lesson progress", async () => {
      const mockUpdateResponse = {
        success: true,
        data: {
          id: 1,
          isCompleted: true,
          timeSpentMinutes: 45,
          userId: 1,
          lessonId: 1,
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
        },
      };

      (
        nodeJsApiClient.nodeJsApiClient.updateLessonProgress as jest.Mock
      ).mockResolvedValue(mockUpdateResponse);

      const { result } = renderHook(() => useLessonProgress(1));

      await act(async () => {
        const updateResult = await result.current.updateProgress({
          isCompleted: true,
          timeSpentMinutes: 45,
        });
        expect(updateResult).toEqual({
          success: true,
          data: mockUpdateResult.data,
        });
      });
    });
  });

  describe("useProgressSummary", () => {
    it("should fetch progress summary", async () => {
      const mockSummaryResponse = {
        success: true,
        data: {
          totalCourses: 5,
          completedCourses: 2,
          totalLessons: 50,
          completedLessons: 25,
          progressPercentage: 50,
          courseProgress: [],
        },
      };

      (
        nodeJsApiClient.nodeJsApiClient.getProgressSummary as jest.Mock
      ).mockResolvedValue(mockSummaryResponse);

      const { result } = renderHook(() => useProgressSummary());

      expect(result.current.loading).toBe(true);

      // Wait for the hook to finish loading
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.summary).toEqual(mockSummaryResponse.data);
    });
  });
});
