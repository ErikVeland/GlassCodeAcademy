const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    const courseCount = await prisma.course.count();
    console.log('Course count:', courseCount);
    
    const moduleCount = await prisma.module.count();
    console.log('Module count:', moduleCount);
    
    const lessonCount = await prisma.lesson.count();
    console.log('Lesson count:', lessonCount);
    
    const quizCount = await prisma.lessonQuiz.count();
    console.log('Quiz count:', quizCount);
    
    if (courseCount > 0) {
      const courses = await prisma.course.findMany({
        take: 3,
        select: {
          id: true,
          title: true,
          slug: true,
          isPublished: true
        }
      });
      console.log('Sample courses:', courses);
    }
    
    if (moduleCount > 0) {
      const modules = await prisma.module.findMany({
        take: 3,
        select: {
          id: true,
          title: true,
          slug: true,
          courseId: true,
          isPublished: true
        }
      });
      console.log('Sample modules:', modules);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error checking database:', error);
    await prisma.$disconnect();
  }
}

checkDatabase();