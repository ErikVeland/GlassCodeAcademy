const { sendNotification } = require('./notificationService');
const {
  getLessonById,
  getModuleById,
  getCourseById,
} = require('./contentService');
const { User } = require('../models');
const logger = require('../utils/logger');
const {
  welcomeTemplate,
  lessonCompletionTemplate,
  quizResultTemplate,
  newCourseTemplate,
  certificateEarnedTemplate,
  forumReplyTemplate,
} = require('../utils/notificationTemplates');

/**
 * Notification Integration Service
 * Integrates notifications with existing features
 */

/**
 * Send welcome notification to new user
 * @param {number} userId - User ID
 * @param {string} userName - User name
 */
async function sendWelcomeNotification(userId, userName) {
  try {
    const templateData = { userName };
    const template = welcomeTemplate(templateData);

    await sendNotification(userId, template.subject, template.text, {
      category: 'welcome',
      type: 'success',
      html: template.html,
    });

    logger.info('Welcome notification sent', { userId, userName });
  } catch (error) {
    logger.error('Error sending welcome notification:', error);
  }
}

/**
 * Send lesson completion notification
 * @param {number} userId - User ID
 * @param {number} lessonId - Lesson ID
 * @param {Object} options - Additional options
 */
async function sendLessonCompletionNotification(
  userId,
  lessonId,
  options = {}
) {
  try {
    // Get user details
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Get lesson details
    const lesson = await getLessonById(lessonId);
    if (!lesson) {
      throw new Error(`Lesson with ID ${lessonId} not found`);
    }

    // Get module details
    const module = await getModuleById(lesson.module_id);
    if (!module) {
      throw new Error(`Module with ID ${lesson.module_id} not found`);
    }

    // Get course details
    const course = await getCourseById(module.course_id);
    if (!course) {
      throw new Error(`Course with ID ${module.course_id} not found`);
    }

    // Get next lesson if available
    let nextLesson = null;
    if (options.nextLessonId) {
      nextLesson = await getLessonById(options.nextLessonId);
    }

    const templateData = {
      userName: user.name || user.email,
      lessonTitle: lesson.title,
      courseTitle: course.title,
      nextLessonTitle: nextLesson ? nextLesson.title : null,
    };

    const template = lessonCompletionTemplate(templateData);

    await sendNotification(userId, template.subject, template.text, {
      category: 'lesson_completion',
      type: 'success',
      entityId: lessonId,
      entityType: 'lesson',
      html: template.html,
    });

    logger.info('Lesson completion notification sent', { userId, lessonId });
  } catch (error) {
    logger.error('Error sending lesson completion notification:', error);
  }
}

/**
 * Send quiz result notification
 * @param {number} userId - User ID
 * @param {number} lessonId - Lesson ID
 * @param {Object} quizResult - Quiz result data
 */
async function sendQuizResultNotification(userId, lessonId, quizResult) {
  try {
    // Get user details
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Get lesson details
    const lesson = await getLessonById(lessonId);
    if (!lesson) {
      throw new Error(`Lesson with ID ${lessonId} not found`);
    }

    // Get module details
    const module = await getModuleById(lesson.module_id);
    if (!module) {
      throw new Error(`Module with ID ${lesson.module_id} not found`);
    }

    // Get course details
    const course = await getCourseById(module.course_id);
    if (!course) {
      throw new Error(`Course with ID ${module.course_id} not found`);
    }

    const { scorePercentage, passed } = quizResult;

    const templateData = {
      userName: user.name || user.email,
      quizTitle: lesson.title,
      score: Math.round(scorePercentage),
      passed,
      courseTitle: course.title,
    };

    const template = quizResultTemplate(templateData);

    await sendNotification(userId, template.subject, template.text, {
      category: 'quiz_result',
      type: passed ? 'success' : 'warning',
      entityId: lessonId,
      entityType: 'quiz',
      html: template.html,
    });

    logger.info('Quiz result notification sent', {
      userId,
      lessonId,
      scorePercentage,
    });
  } catch (error) {
    logger.error('Error sending quiz result notification:', error);
  }
}

/**
 * Send certificate earned notification
 * @param {number} userId - User ID
 * @param {number} courseId - Course ID
 * @param {number} certificateId - Certificate ID
 */
async function sendCertificateNotification(userId, courseId, certificateId) {
  try {
    // Get user details
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Get course details
    const course = await getCourseById(courseId);
    if (!course) {
      throw new Error(`Course with ID ${courseId} not found`);
    }

    const templateData = {
      userName: user.name || user.email,
      courseTitle: course.title,
      certificateId,
    };

    const template = certificateEarnedTemplate(templateData);

    await sendNotification(userId, template.subject, template.text, {
      category: 'certificate',
      type: 'success',
      entityId: courseId,
      entityType: 'course',
      html: template.html,
    });

    logger.info('Certificate notification sent', {
      userId,
      courseId,
      certificateId,
    });
  } catch (error) {
    logger.error('Error sending certificate notification:', error);
  }
}

/**
 * Send forum reply notification
 * @param {number} userId - User ID of the post author
 * @param {Object} replyData - Reply data
 */
async function sendForumReplyNotification(userId, replyData) {
  try {
    // Get user details
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const { postTitle, replierName, replyContent } = replyData;

    const templateData = {
      userName: user.name || user.email,
      postTitle,
      replierName,
      replyContent,
    };

    const template = forumReplyTemplate(templateData);

    await sendNotification(userId, template.subject, template.text, {
      category: 'forum_reply',
      type: 'info',
      html: template.html,
    });

    logger.info('Forum reply notification sent', { userId, postTitle });
  } catch (error) {
    logger.error('Error sending forum reply notification:', error);
  }
}

/**
 * Send new course announcement notification
 * @param {Array} userIds - Array of user IDs
 * @param {Object} courseData - Course data
 */
async function sendNewCourseNotification(userIds, courseData) {
  try {
    const { courseTitle, courseDescription } = courseData;

    // Send to each user
    for (const userId of userIds) {
      try {
        // Get user details
        const user = await User.findByPk(userId);
        if (!user) {
          logger.warn('User not found for new course notification', { userId });
          continue;
        }

        const templateData = {
          userName: user.name || user.email,
          courseTitle,
          courseDescription,
        };

        const template = newCourseTemplate(templateData);

        await sendNotification(userId, template.subject, template.text, {
          category: 'new_course',
          type: 'info',
          html: template.html,
        });

        logger.info('New course notification sent', { userId, courseTitle });
      } catch (userError) {
        logger.error('Error sending new course notification to user:', {
          userId,
          error: userError.message,
        });
      }
    }
  } catch (error) {
    logger.error('Error sending new course notifications:', error);
  }
}

module.exports = {
  sendWelcomeNotification,
  sendLessonCompletionNotification,
  sendQuizResultNotification,
  sendCertificateNotification,
  sendForumReplyNotification,
  sendNewCourseNotification,
};
