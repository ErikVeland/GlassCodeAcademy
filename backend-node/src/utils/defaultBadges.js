const { Badge } = require('../models');

// Default badges to be created when the application starts
const defaultBadges = [
  {
    name: 'First Lesson Completed',
    description: 'Complete your first lesson',
    icon: 'first-lesson',
    category: 'completion',
    points: 10,
    criteria: {
      type: 'lesson_completion',
      minLessons: 1,
    },
  },
  {
    name: 'Course Master',
    description: 'Complete all lessons in a course',
    icon: 'course-master',
    category: 'completion',
    points: 50,
    criteria: {
      type: 'course_completion',
      minCourses: 1,
    },
  },
  {
    name: 'Quiz Champion',
    description: 'Achieve a perfect score on a quiz',
    icon: 'quiz-champion',
    category: 'excellence',
    points: 30,
    criteria: {
      type: 'perfect_score',
    },
  },
  {
    name: 'Knowledge Seeker',
    description: 'Complete 10 lessons',
    icon: 'knowledge-seeker',
    category: 'completion',
    points: 25,
    criteria: {
      type: 'lesson_completion',
      minLessons: 10,
    },
  },
  {
    name: 'Quiz Expert',
    description: 'Maintain an average quiz score of 90% or higher',
    icon: 'quiz-expert',
    category: 'excellence',
    points: 40,
    criteria: {
      type: 'quiz_excellence',
      minAverageScore: 90,
    },
  },
  {
    name: 'Dedicated Learner',
    description: 'Complete 50 lessons',
    icon: 'dedicated-learner',
    category: 'completion',
    points: 100,
    criteria: {
      type: 'lesson_completion',
      minLessons: 50,
    },
  },
  {
    name: 'Quiz Enthusiast',
    description: 'Attempt 20 quizzes',
    icon: 'quiz-enthusiast',
    category: 'participation',
    points: 20,
    criteria: {
      type: 'quiz_participation',
      minAttempts: 20,
    },
  },
  {
    name: 'Speed Learner',
    description: 'Complete a lesson in under 10 minutes',
    icon: 'speed-learner',
    category: 'excellence',
    points: 35,
    criteria: {
      type: 'speed_completion',
      maxTimeMinutes: 10,
    },
  },
];

// Function to create default badges
const createDefaultBadges = async () => {
  try {
    for (const badgeData of defaultBadges) {
      // Check if badge already exists
      const existingBadge = await Badge.findOne({
        where: {
          name: badgeData.name,
        },
      });

      if (!existingBadge) {
        // Create the badge
        await Badge.create(badgeData);
        console.log(`Created badge: ${badgeData.name}`);
      }
    }
    console.log('Default badges created successfully');
  } catch (error) {
    console.error('Error creating default badges:', error);
  }
};

module.exports = {
  defaultBadges,
  createDefaultBadges,
};
