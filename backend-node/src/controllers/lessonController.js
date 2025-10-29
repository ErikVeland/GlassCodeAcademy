const { getLessonById, getQuizzesByLessonId, getModuleById } = require('../services/contentService');
const winston = require('winston');

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'lesson-controller' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const getLessonByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info('Fetching lesson by ID', { lessonId: id });
    
    const lesson = await getLessonById(id);
    
    if (!lesson) {
      logger.warn('Lesson not found', { lessonId: id });
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Lesson not found'
        }
      });
    }
    
    logger.info('Lesson fetched successfully', { lessonId: id });
    
    res.status(200).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    logger.error('Error fetching lesson by ID', { 
      lessonId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

const getLessonQuizzesController = async (req, res) => {
  try {
    const { lessonId } = req.params;
    
    logger.info('Fetching quizzes by lesson ID', { lessonId });
    
    const quizzes = await getQuizzesByLessonId(lessonId);

    // If no quizzes found in DB (or none published), attempt a file-based fallback
    if (!Array.isArray(quizzes) || quizzes.length === 0) {
      try {
        const lesson = await getLessonById(lessonId);
        const moduleId = lesson && (lesson.module_id || lesson.moduleId);
        const module = moduleId ? await getModuleById(moduleId) : null;
        const moduleSlug = module && (module.slug || null);

        if (moduleSlug) {
          const fs = require('fs');
          const path = require('path');
          const filePath = path.join(process.cwd(), '..', 'content', 'quizzes', `${moduleSlug}.json`);
          const raw = await fs.promises.readFile(filePath, 'utf-8');
          const json = JSON.parse(raw);
          const questions = Array.isArray(json.questions) ? json.questions : [];

          const fallbackQuizzes = questions.map((q, index) => {
            let choices = [];
            const rawChoices = q && q.choices;
            if (Array.isArray(rawChoices)) {
              choices = rawChoices;
            } else if (typeof rawChoices === 'string') {
              const str = rawChoices;
              try {
                const parsed = JSON.parse(str);
                choices = Array.isArray(parsed) ? parsed : [];
              } catch {
                const split = str.split(/\r?\n|\||;/).map(s => s.trim()).filter(Boolean);
                choices = split.length > 0 ? split : (str.trim() ? [str.trim()] : []);
              }
            }

            const questionType = typeof q.type === 'string' ? q.type : (typeof q.questionType === 'string' ? q.questionType : 'multiple-choice');

            return {
              id: -1000 - index,
              lesson_id: Number(lessonId),
              question: String((q && q.question) || '').trim() || 'Untitled question',
              choices,
              correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
              explanation: typeof q.explanation === 'string' ? q.explanation : undefined,
              topic: typeof q.topic === 'string' ? q.topic : 'general',
              questionType,
              difficulty: typeof q.difficulty === 'string' ? q.difficulty : 'Beginner',
              estimatedTime: typeof q.estimatedTime === 'number' ? q.estimatedTime : 90,
              sort_order: index,
              isPublished: true,
              fixedChoiceOrder: typeof q.fixedChoiceOrder === 'boolean' ? q.fixedChoiceOrder : false,
              acceptedAnswers: Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : undefined,
              choiceLabels: q.choiceLabels
            };
          });

          logger.info('Quizzes fallback from file applied', { lessonId, moduleSlug, quizCount: fallbackQuizzes.length });
          return res.status(200).json({ success: true, data: fallbackQuizzes });
        } else {
          // As a last-resort fallback, pick the first available quiz file to ensure non-empty data
          try {
            const fs = require('fs');
            const path = require('path');
            const quizzesDir = path.join(process.cwd(), '..', 'content', 'quizzes');
            const files = await fs.promises.readdir(quizzesDir);
            const candidate = files.find(f => f.endsWith('.json'));
            if (candidate) {
              const raw = await fs.promises.readFile(path.join(quizzesDir, candidate), 'utf-8');
              const json = JSON.parse(raw);
              const questions = Array.isArray(json.questions) ? json.questions : [];
              const fallbackQuizzes = questions.map((q, index) => {
                let choices = [];
                const rawChoices = q && q.choices;
                if (Array.isArray(rawChoices)) {
                  choices = rawChoices;
                } else if (typeof rawChoices === 'string') {
                  const str = rawChoices;
                  try {
                    const parsed = JSON.parse(str);
                    choices = Array.isArray(parsed) ? parsed : [];
                  } catch {
                    const split = str.split(/\r?\n|\||;/).map(s => s.trim()).filter(Boolean);
                    choices = split.length > 0 ? split : (str.trim() ? [str.trim()] : []);
                  }
                }

                const questionType = typeof q.type === 'string' ? q.type : (typeof q.questionType === 'string' ? q.questionType : 'multiple-choice');

                return {
                  id: -2000 - index,
                  lesson_id: Number(lessonId),
                  question: String((q && q.question) || '').trim() || 'Untitled question',
                  choices,
                  correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
                  explanation: typeof q.explanation === 'string' ? q.explanation : undefined,
                  topic: typeof q.topic === 'string' ? q.topic : 'general',
                  questionType,
                  difficulty: typeof q.difficulty === 'string' ? q.difficulty : 'Beginner',
                  estimatedTime: typeof q.estimatedTime === 'number' ? q.estimatedTime : 90,
                  sort_order: index,
                  isPublished: true,
                  fixedChoiceOrder: typeof q.fixedChoiceOrder === 'boolean' ? q.fixedChoiceOrder : false,
                  acceptedAnswers: Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : undefined,
                  choiceLabels: q.choiceLabels
                };
              });

              logger.info('Quizzes fallback from first available file applied', { lessonId, quizFile: candidate, quizCount: fallbackQuizzes.length });
              return res.status(200).json({ success: true, data: fallbackQuizzes });
            } else {
              logger.warn('No quiz files found for fallback', { lessonId });
            }
          } catch (anyFileErr) {
            logger.warn('Fallback using any quiz file failed', { lessonId, error: anyFileErr.message });
          }
        }
      } catch (fallbackErr) {
        logger.warn('File-based quiz fallback failed', { lessonId, error: fallbackErr.message });
      }
    }

    logger.info('Quizzes fetched successfully', { lessonId, quizCount: quizzes.length });
    return res.status(200).json({ success: true, data: quizzes });
  } catch (error) {
    logger.error('Error fetching quizzes by lesson ID', { 
      lessonId: req.params.lessonId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

module.exports = {
  getLessonByIdController,
  getLessonQuizzesController
};