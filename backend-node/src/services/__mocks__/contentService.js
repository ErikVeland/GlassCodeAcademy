// Mock content service for testing
const getAllCourses = async (options = {}) => {
  return {
    courses: [
      {
        id: 1,
        title: 'Test Course',
        description: 'A test course',
        slug: 'test-course',
        isPublished: true,
        order: 1,
        difficulty: 'Beginner',
        estimatedHours: 10
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      pages: 1
    }
  };
};

const getCourseById = async (id) => {
  if (id === '99999') {
    return null;
  }
  
  return {
    id: 1,
    title: 'Test Course',
    description: 'A test course',
    slug: 'test-course',
    isPublished: true,
    order: 1,
    difficulty: 'Beginner',
    estimatedHours: 10
  };
};

const getModuleById = async (id) => {
  return {
    id: 1,
    title: 'Test Module',
    description: 'A test module',
    slug: 'test-module',
    order: 1,
    isPublished: true
  };
};

const getLessonById = async (id) => {
  return {
    id: 1,
    title: 'Test Lesson',
    slug: 'test-lesson',
    order: 1,
    content: {
      type: 'html',
      content: '<p>Test content</p>'
    },
    isPublished: true,
    difficulty: 'Beginner',
    estimatedMinutes: 30
  };
};

const getQuizzesByLessonId = async (lessonId) => {
  return [
    {
      id: 1,
      question: 'Test question?',
      topic: 'test',
      difficulty: 'Beginner',
      choices: ['A', 'B', 'C', 'D'],
      correctAnswer: 0
    }
  ];
};

module.exports = {
  getAllCourses,
  getCourseById,
  getModuleById,
  getLessonById,
  getQuizzesByLessonId
};