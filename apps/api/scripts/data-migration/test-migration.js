#!/usr/bin/env node

const { sequelize } = require('../../src/config/database');
const { Course, Module, Lesson, Quiz } = require('../../src/models');

async function testMigration() {
  try {
    console.log('Testing migrated data...');
    
    // Test course data
    const courses = await Course.findAll();
    console.log(`Found ${courses.length} courses`);
    
    if (courses.length > 0) {
      const course = courses[0];
      console.log(`Course: ${course.title}`);
      
      // Test modules
      const modules = await Module.findAll({ 
        where: { courseId: course.id },
        order: [['order', 'ASC']]
      });
      console.log(`Found ${modules.length} modules`);
      
      if (modules.length > 0) {
        const module = modules[0];
        console.log(`First module: ${module.title}`);
        
        // Test lessons
        const lessons = await Lesson.findAll({
          where: { moduleId: module.id },
          order: [['order', 'ASC']]
        });
        console.log(`Found ${lessons.length} lessons in first module`);
        
        if (lessons.length > 0) {
          const lesson = lessons[0];
          console.log(`First lesson: ${lesson.title}`);
          console.log(`Lesson content keys:`, Object.keys(lesson.content || {}));
          
          // Test quizzes
          const quizzes = await Quiz.findAll({
            where: { lessonId: lesson.id },
            order: [['sortOrder', 'ASC']]
          });
          console.log(`Found ${quizzes.length} quiz questions for first lesson`);
          
          if (quizzes.length > 0) {
            const quiz = quizzes[0];
            console.log(`First quiz question: ${quiz.question.substring(0, 50)}...`);
            console.log(`Quiz choices count:`, (quiz.choices || []).length);
          }
        }
      }
    }
    
    console.log('Test completed successfully!');
    await sequelize.close();
  } catch (error) {
    console.error('Test failed:', error);
    await sequelize.close();
    process.exit(1);
  }
}

if (require.main === module) {
  testMigration();
}