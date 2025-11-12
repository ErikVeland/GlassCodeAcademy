const { PrismaClient } = require('@prisma/client');

async function checkQuizzes() {
  const prisma = new PrismaClient();
  
  try {
    // Get some sample quizzes to understand their structure
    const quizzes = await prisma.lessonQuiz.findMany({
      take: 5,
      select: {
        id: true,
        question: true,
        moduleId: true,
        module: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });
    
    console.log('Sample quizzes:', quizzes);
    
    // Check if quizzes are associated with modules
    const quizzesWithModule = await prisma.lessonQuiz.count({
      where: {
        moduleId: {
          not: null
        }
      }
    });
    
    console.log('Quizzes with module ID:', quizzesWithModule);
    
    // Check if quizzes are associated with lessons (they shouldn't be based on schema)
    // In the schema, LessonQuiz doesn't have a lessonId field
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error checking quizzes:', error);
    await prisma.$disconnect();
  }
}

checkQuizzes();