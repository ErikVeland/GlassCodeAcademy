/**
 * Tests for Node.js API Client
 */

import { nodeJsApiClient } from '../nodeJsApiClient';

// Mock fetch globally
global.fetch = jest.fn();

describe('NodeJsApiClient', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 1,
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User'
          },
          token: 'mock-token'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await nodeJsApiClient.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User'
          })
        })
      );
    });

    it('should login an existing user', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 1,
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User'
          },
          token: 'mock-token'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await nodeJsApiClient.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          })
        })
      );
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const response = await nodeJsApiClient.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('NETWORK_ERROR');
    });
  });

  describe('Profile', () => {
    beforeEach(() => {
      // Set auth token for protected endpoints
      nodeJsApiClient.setAuthToken('test-token');
    });

    afterEach(() => {
      // Clear auth token after each test
      nodeJsApiClient.clearAuthToken();
    });

    it('should get user profile', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 1,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          isActive: true,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          roles: []
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await nodeJsApiClient.getProfile();

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/profile/profile',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }
        })
      );
    });

    it('should update user profile', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 1,
          email: 'test@example.com',
          firstName: 'Updated',
          lastName: 'Name',
          isActive: true,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          roles: []
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await nodeJsApiClient.updateProfile({
        firstName: 'Updated',
        lastName: 'Name'
      });

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/profile/profile',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({
            firstName: 'Updated',
            lastName: 'Name'
          })
        })
      );
    });
  });

  describe('Courses', () => {
    it('should get courses with pagination', async () => {
      const mockResponse = {
        success: true,
        data: {
          courses: [
            {
              id: 1,
              title: 'Test Course',
              description: 'A test course',
              slug: 'test-course',
              isPublished: true,
              order: 1,
              difficulty: 'Beginner',
              estimatedHours: 10,
              createdAt: '2023-01-01T00:00:00Z',
              updatedAt: '2023-01-01T00:00:00Z'
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            pages: 1
          }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await nodeJsApiClient.getCourses(1, 10);

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/courses?page=1&limit=10',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should get course by ID', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 1,
          title: 'Test Course',
          description: 'A test course',
          slug: 'test-course',
          isPublished: true,
          order: 1,
          difficulty: 'Beginner',
          estimatedHours: 10,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await nodeJsApiClient.getCourseById(1);

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/courses/1',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    });
  });

  describe('Modules', () => {
    it('should get modules by course ID', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 1,
            title: 'Test Module',
            description: 'A test module',
            slug: 'test-module',
            order: 1,
            isPublished: true,
            courseId: 1,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await nodeJsApiClient.getModulesByCourseId(1);

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/courses/1/modules',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    });
  });

  describe('Lessons', () => {
    it('should get lessons by module ID', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 1,
            title: 'Test Lesson',
            slug: 'test-lesson',
            order: 1,
            content: {},
            metadata: {},
            isPublished: true,
            difficulty: 'Beginner',
            estimatedMinutes: 30,
            moduleId: 1,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await nodeJsApiClient.getLessonsByModuleId(1);

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/modules/1/lessons',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    });
  });

  describe('Quizzes', () => {
    it('should get quizzes by lesson ID', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 1,
            question: 'Test question?',
            topic: 'test',
            difficulty: 'Beginner',
            choices: ['A', 'B', 'C', 'D'],
            fixedChoiceOrder: false,
            questionType: 'multiple-choice',
            estimatedTime: 90,
            correctAnswer: 0,
            quizType: 'multiple-choice',
            sortOrder: 1,
            isPublished: true,
            lessonId: 1,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await nodeJsApiClient.getQuizzesByLessonId(1);

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/lessons/1/quizzes',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should submit quiz answers', async () => {
      const mockResponse = {
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
              explanation: 'Correct!'
            }
          ]
        }
      };

      const submissionData = {
        answers: [
          {
            quizId: 1,
            selectedAnswer: 0
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await nodeJsApiClient.submitQuizAnswers(1, submissionData);

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/quiz/lessons/1/submit',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submissionData)
        })
      );
    });
  });

  describe('Progress', () => {
    beforeEach(() => {
      // Set auth token for protected endpoints
      nodeJsApiClient.setAuthToken('test-token');
    });

    afterEach(() => {
      // Clear auth token after each test
      nodeJsApiClient.clearAuthToken();
    });

    it('should get course progress', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 1,
          completedLessons: 5,
          totalLessons: 10,
          progressPercentage: 50,
          userId: 1,
          courseId: 1,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await nodeJsApiClient.getCourseProgress(1);

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/progress/courses/1',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }
        })
      );
    });

    it('should get progress summary', async () => {
      const mockResponse = {
        success: true,
        data: {
          totalCourses: 5,
          completedCourses: 2,
          totalLessons: 50,
          completedLessons: 25,
          progressPercentage: 50,
          courseProgress: []
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await nodeJsApiClient.getProgressSummary();

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/quiz/summary',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }
        })
      );
    });
  });
});