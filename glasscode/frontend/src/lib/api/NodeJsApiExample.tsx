/**
 * Example Component demonstrating usage of Node.js API Client and Hooks
 * This component shows how to integrate the new Node.js backend with the frontend
 */

import React, { useState } from 'react';
import {
  useAuth,
  useCourses,
  useCourse,
  useModules,
  useLessons,
  useQuizzes,
  useQuizSubmission,
  useLessonProgress
} from '@/lib/api/hooks';

// Login Form Component
const LoginForm: React.FC = () => {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        const result = await register(email, password, firstName, lastName);
        if (!result.success) {
          setError(result.error?.message || 'Registration failed');
        }
      } else {
        const result = await login(email, password);
        if (!result.success) {
          setError(result.error?.message || 'Login failed');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">
        {isRegistering ? 'Register' : 'Login'}
      </h2>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {isRegistering && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </>
        )}
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {loading ? 'Loading...' : (isRegistering ? 'Register' : 'Login')}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="text-blue-500 hover:text-blue-700"
        >
          {isRegistering 
            ? 'Already have an account? Login' 
            : "Don't have an account? Register"}
        </button>
      </div>
    </div>
  );
};

// Course List Component
const CourseList: React.FC = () => {
  const { courses, loading, error, pagination } = useCourses(1, 10);
  
  if (loading) {
    return <div>Loading courses...</div>;
  }
  
  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Courses</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
            <p className="text-gray-600 mb-4">{course.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Difficulty: {course.difficulty}</span>
              <span className="text-sm text-gray-500">{course.estimatedHours} hours</span>
            </div>
            <div className="mt-4">
              <CourseModules courseId={course.id} />
            </div>
          </div>
        ))}
      </div>
      
      {pagination && (
        <div className="mt-6 flex justify-center">
          <span className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.pages}
          </span>
        </div>
      )}
    </div>
  );
};

// Course Modules Component
const CourseModules: React.FC<{ courseId: number }> = ({ courseId }) => {
  const { modules, loading, error } = useModules(courseId);
  
  if (loading) {
    return <div>Loading modules...</div>;
  }
  
  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }
  
  return (
    <div>
      <h4 className="font-medium mb-2">Modules:</h4>
      <ul className="list-disc list-inside">
        {modules.map((module) => (
          <li key={module.id} className="text-sm">
            {module.title}
            <ModuleLessons moduleId={module.id} />
          </li>
        ))}
      </ul>
    </div>
  );
};

// Module Lessons Component
const ModuleLessons: React.FC<{ moduleId: number }> = ({ moduleId }) => {
  const { lessons, loading, error } = useLessons(moduleId);
  
  if (loading) {
    return <span className="ml-2 text-xs">Loading lessons...</span>;
  }
  
  if (error) {
    return <span className="ml-2 text-xs text-red-500">Error: {error}</span>;
  }
  
  return (
    <ul className="list-circle list-inside ml-4 mt-1">
      {lessons.map((lesson) => (
        <li key={lesson.id} className="text-xs">
          {lesson.title}
          <LessonQuiz lessonId={lesson.id} />
        </li>
      ))}
    </ul>
  );
};

// Lesson Quiz Component
const LessonQuiz: React.FC<{ lessonId: number }> = ({ lessonId }) => {
  const { quizzes, loading, error } = useQuizzes(lessonId);
  const { progress, updateProgress } = useLessonProgress(lessonId);
  const { submitQuiz, loading: submitting, result } = useQuizSubmission();
  
  const [answers, setAnswers] = useState<Record<number, number>>({});
  
  const handleAnswerChange = (quizId: number, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [quizId]: answerIndex
    }));
  };
  
  const handleSubmit = async () => {
    const submissionData = {
      answers: Object.entries(answers).map(([quizId, selectedAnswer]) => ({
        quizId: parseInt(quizId),
        selectedAnswer
      }))
    };
    
    const result = await submitQuiz(lessonId, submissionData);
    
    if (result.success) {
      // Update lesson progress to mark as completed
      await updateProgress({ isCompleted: true });
    }
  };
  
  if (loading) {
    return <span className="ml-2 text-xs">Loading quiz...</span>;
  }
  
  if (error) {
    return <span className="ml-2 text-xs text-red-500">Error: {error}</span>;
  }
  
  return (
    <div className="ml-4 mt-2 p-2 border border-gray-200 rounded">
      <h5 className="font-medium text-xs mb-2">Quiz:</h5>
      
      {result ? (
        <div className="text-xs">
          <p>Score: {result.data?.scorePercentage.toFixed(0)}%</p>
          <p>Correct: {result.data?.correctAnswers}/{result.data?.totalQuestions}</p>
        </div>
      ) : (
        <>
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="mb-3">
              <p className="text-xs mb-1">{quiz.question}</p>
              <div className="flex flex-wrap gap-2">
                {quiz.choices?.map((choice, index) => (
                  <label key={index} className="flex items-center text-xs">
                    <input
                      type="radio"
                      name={`quiz-${quiz.id}`}
                      value={index}
                      onChange={() => handleAnswerChange(quiz.id, index)}
                      className="mr-1"
                    />
                    {choice}
                  </label>
                ))}
              </div>
            </div>
          ))}
          
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-2 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </>
      )}
      
      {progress && (
        <div className="mt-2 text-xs">
          {progress.isCompleted ? (
            <span className="text-green-600">Completed</span>
          ) : (
            <span className="text-gray-500">Not completed</span>
          )}
        </div>
      )}
    </div>
  );
};

// Main Example Component
const NodeJsApiExample: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Node.js API Example</h1>
          {isAuthenticated && (
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          )}
        </div>
      </header>
      
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {!isAuthenticated ? (
            <LoginForm />
          ) : (
            <CourseList />
          )}
        </div>
      </main>
    </div>
  );
};

export default NodeJsApiExample;