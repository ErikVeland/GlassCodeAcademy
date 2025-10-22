/**
 * React hooks for Node.js API integration
 * Provides custom hooks for interacting with the Node.js backend API
 */

import { useState, useEffect, useCallback } from 'react';
import { nodeJsApiClient } from './nodeJsApiClient';
import { 
  Course, 
  Module, 
  Lesson, 
  QuizQuestion, 
  QuizSubmissionRequest, 
  QuizSubmissionResponse,
  UserProgress,
  UserLessonProgress,
  ProgressSummary
} from './nodeJsApiClient';

// Authentication hooks
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback(async (email: string, password: string) => {
    const response = await nodeJsApiClient.login({ email, password });
    
    if (response.success && response.data) {
      nodeJsApiClient.setAuthToken(response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      return { success: true, data: response.data };
    }
    
    return { success: false, error: response.error };
  }, []);

  const logout = useCallback(() => {
    nodeJsApiClient.clearAuthToken();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const register = useCallback(async (email: string, password: string, firstName: string, lastName: string) => {
    const response = await nodeJsApiClient.register({ email, password, firstName, lastName });
    
    if (response.success && response.data) {
      nodeJsApiClient.setAuthToken(response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      return { success: true, data: response.data };
    }
    
    return { success: false, error: response.error };
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    // In a real implementation, you might check for a stored token
    // and validate it with the backend
    setLoading(false);
  }, []);

  return {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    register
  };
};

// Course hooks
export const useCourses = (page = 1, limit = 10) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await nodeJsApiClient.getCourses(page, limit);
      
      if (response.success && response.data) {
        setCourses(response.data.courses);
        setPagination(response.data.pagination);
      } else {
        setError(response.error?.message || 'Failed to fetch courses');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return {
    courses,
    loading,
    error,
    pagination,
    refetch: fetchCourses
  };
};

export const useCourse = (id: number) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await nodeJsApiClient.getCourseById(id);
      
      if (response.success && response.data) {
        setCourse(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch course');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchCourse();
    }
  }, [id, fetchCourse]);

  return {
    course,
    loading,
    error,
    refetch: fetchCourse
  };
};

// Module hooks
export const useModules = (courseId: number) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await nodeJsApiClient.getModulesByCourseId(courseId);
      
      if (response.success && response.data) {
        setModules(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch modules');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      fetchModules();
    }
  }, [courseId, fetchModules]);

  return {
    modules,
    loading,
    error,
    refetch: fetchModules
  };
};

// Lesson hooks
export const useLessons = (moduleId: number) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await nodeJsApiClient.getLessonsByModuleId(moduleId);
      
      if (response.success && response.data) {
        setLessons(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch lessons');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    if (moduleId) {
      fetchLessons();
    }
  }, [moduleId, fetchLessons]);

  return {
    lessons,
    loading,
    error,
    refetch: fetchLessons
  };
};

// Quiz hooks
export const useQuizzes = (lessonId: number) => {
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await nodeJsApiClient.getQuizzesByLessonId(lessonId);
      
      if (response.success && response.data) {
        setQuizzes(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch quizzes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    if (lessonId) {
      fetchQuizzes();
    }
  }, [lessonId, fetchQuizzes]);

  return {
    quizzes,
    loading,
    error,
    refetch: fetchQuizzes
  };
};

export const useQuizSubmission = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizSubmissionResponse | null>(null);

  const submitQuiz = useCallback(async (lessonId: number, data: QuizSubmissionRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await nodeJsApiClient.submitQuizAnswers(lessonId, data);
      
      if (response.success && response.data) {
        setResult(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.error?.message || 'Failed to submit quiz');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      return { success: false, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    submitQuiz,
    loading,
    error,
    result
  };
};

// Progress hooks
export const useCourseProgress = (courseId: number) => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await nodeJsApiClient.getCourseProgress(courseId);
      
      if (response.success && response.data) {
        setProgress(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch progress');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      fetchProgress();
    }
  }, [courseId, fetchProgress]);

  const updateProgress = useCallback(async (_data: Partial<UserLessonProgress>) => {
    void _data;
    // This would need to be called with a specific lessonId
    // For now, we'll just refetch the progress
    fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    loading,
    error,
    refetch: fetchProgress,
    updateProgress
  };
};

export const useLessonProgress = (lessonId: number) => {
  const [progress, setProgress] = useState<UserLessonProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await nodeJsApiClient.getLessonProgress(lessonId);
      
      if (response.success && response.data) {
        setProgress(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch lesson progress');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    if (lessonId) {
      fetchProgress();
    }
  }, [lessonId, fetchProgress]);

  const updateProgress = useCallback(async (data: Partial<UserLessonProgress>) => {
    try {
      const response = await nodeJsApiClient.updateLessonProgress(lessonId, data);
      
      if (response.success && response.data) {
        setProgress(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.error?.message || 'Failed to update lesson progress');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      return { success: false, error: { message: errorMessage } };
    }
  }, [lessonId]);

  return {
    progress,
    loading,
    error,
    refetch: fetchProgress,
    updateProgress
  };
};

export const useProgressSummary = () => {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await nodeJsApiClient.getProgressSummary();
      
      if (response.success && response.data) {
        setSummary(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch progress summary');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary
  };
};