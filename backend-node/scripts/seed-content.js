const fs = require('fs');
const path = require('path');
const { Course, Module, Lesson, LessonQuiz } = require('../src/models');

// Load content from JSON files and seed the database
async function seedContent() {
  try {
    console.log('🔄 Starting content seeding for Node.js backend...');
    
    // Load registry to get module information
    const registryPath = path.join(__dirname, '../../content/registry.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    
    console.log(`Found ${registry.modules.length} modules in registry`);
    
    // Create courses (one for each module)
    for (const moduleInfo of registry.modules) {
      console.log(`Processing module: ${moduleInfo.title}`);
      
      // Create course
      const [course, courseCreated] = await Course.findOrCreate({
        where: { slug: moduleInfo.slug },
        defaults: {
          title: moduleInfo.title,
          description: moduleInfo.description,
          slug: moduleInfo.slug,
          order: moduleInfo.order,
          difficulty: moduleInfo.difficulty,
          isPublished: true,
          estimatedHours: moduleInfo.estimatedHours || 10
        }
      });
      
      if (courseCreated) {
        console.log(`  ✅ Created course: ${course.title}`);
      } else {
        console.log(`  🔁 Updated course: ${course.title}`);
        await course.update({
          title: moduleInfo.title,
          description: moduleInfo.description,
          order: moduleInfo.order,
          difficulty: moduleInfo.difficulty,
          isPublished: true,
          estimatedHours: moduleInfo.estimatedHours || 10
        });
      }
      
      // Create module
      const [module, moduleCreated] = await Module.findOrCreate({
        where: { slug: moduleInfo.slug },
        defaults: {
          title: moduleInfo.title,
          description: moduleInfo.description,
          slug: moduleInfo.slug,
          order: moduleInfo.order,
          isPublished: true,
          course_id: course.id
        }
      });
      
      if (moduleCreated) {
        console.log(`  ✅ Created module: ${module.title}`);
      } else {
        console.log(`  🔁 Updated module: ${module.title}`);
        await module.update({
          title: moduleInfo.title,
          description: moduleInfo.description,
          order: moduleInfo.order,
          isPublished: true,
          course_id: course.id
        });
      }
      
      // Load lessons for this module
      const lessonsPath = path.join(__dirname, `../../content/lessons/${moduleInfo.slug}.json`);
      let lessons = [];
      
      if (fs.existsSync(lessonsPath)) {
        const lessonsData = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
        console.log(`  Found ${lessonsData.length} lessons`);
        
        for (let i = 0; i < lessonsData.length; i++) {
          const lessonData = lessonsData[i];
          
          const [lesson, lessonCreated] = await Lesson.findOrCreate({
            where: { slug: `${moduleInfo.slug}-lesson-${i+1}` },
            defaults: {
              title: lessonData.title || `Lesson ${i+1}`,
              slug: `${moduleInfo.slug}-lesson-${i+1}`,
              order: i + 1,
              content: lessonData,
              isPublished: true,
              difficulty: moduleInfo.difficulty,
              estimatedMinutes: lessonData.estimatedMinutes || 30,
              module_id: module.id
            }
          });
          
          lessons.push(lesson);
          
          if (lessonCreated) {
            console.log(`    ✅ Created lesson: ${lesson.title}`);
          } else {
            console.log(`    🔁 Updated lesson: ${lesson.title}`);
            await lesson.update({
              title: lessonData.title || `Lesson ${i+1}`,
              content: lessonData,
              isPublished: true,
              difficulty: moduleInfo.difficulty,
              estimatedMinutes: lessonData.estimatedMinutes || 30,
              module_id: module.id
            });
          }
        }
      } else {
        console.log(`  ⚠️  No lessons file found for ${moduleInfo.slug}`);
      }
      
      // Load quizzes for this module
      const quizzesPath = path.join(__dirname, `../../content/quizzes/${moduleInfo.slug}.json`);
      if (fs.existsSync(quizzesPath)) {
        const quizzesData = JSON.parse(fs.readFileSync(quizzesPath, 'utf8'));
        console.log(`  Found ${quizzesData.questions.length} quiz questions`);
        
        // Create quizzes for each lesson (distribute evenly)
        const questionsPerLesson = Math.ceil(quizzesData.questions.length / Math.max(lessons.length, 1));
        
        for (let i = 0; i < quizzesData.questions.length; i++) {
          const questionData = quizzesData.questions[i];
          // Assign to a lesson (round-robin distribution)
          const lessonIndex = Math.floor(i / questionsPerLesson) % Math.max(lessons.length, 1);
          const lessonId = lessons.length > 0 ? lessons[lessonIndex].id : module.id;
          
          const [quiz, quizCreated] = await LessonQuiz.findOrCreate({
            where: { 
              question: questionData.question,
              lesson_id: lessonId
            },
            defaults: {
              question: questionData.question,
              topic: questionData.topic || moduleInfo.title,
              difficulty: questionData.difficulty || moduleInfo.difficulty,
              choices: questionData.choices || [],
              fixedChoiceOrder: questionData.fixedChoiceOrder || false,
              choiceLabels: questionData.choiceLabels || null,
              acceptedAnswers: questionData.acceptedAnswers || null,
              explanation: questionData.explanation || null,
              industryContext: questionData.industryContext || null,
              tags: questionData.tags || [],
              questionType: questionData.questionType || 'multiple-choice',
              estimatedTime: questionData.estimatedTime || 60,
              correctAnswer: questionData.correctAnswer !== undefined ? questionData.correctAnswer : 0,
              quizType: questionData.quizType || 'multiple-choice',
              sources: questionData.sources || null,
              sortOrder: questionData.sortOrder || i + 1,
              isPublished: true,
              lesson_id: lessonId
            }
          });
          
          if (quizCreated) {
            console.log(`    ✅ Created quiz question: ${quiz.question.substring(0, 50)}...`);
          } else {
            console.log(`    🔁 Updated quiz question: ${quiz.question.substring(0, 50)}...`);
            await quiz.update({
              topic: questionData.topic || moduleInfo.title,
              difficulty: questionData.difficulty || moduleInfo.difficulty,
              choices: questionData.choices || [],
              fixedChoiceOrder: questionData.fixedChoiceOrder || false,
              choiceLabels: questionData.choiceLabels || null,
              acceptedAnswers: questionData.acceptedAnswers || null,
              explanation: questionData.explanation || null,
              industryContext: questionData.industryContext || null,
              tags: questionData.tags || [],
              questionType: questionData.questionType || 'multiple-choice',
              estimatedTime: questionData.estimatedTime || 60,
              correctAnswer: questionData.correctAnswer !== undefined ? questionData.correctAnswer : 0,
              quizType: questionData.quizType || 'multiple-choice',
              sources: questionData.sources || null,
              sortOrder: questionData.sortOrder || i + 1,
              isPublished: true
            });
          }
        }
      } else {
        console.log(`  ⚠️  No quizzes file found for ${moduleInfo.slug}`);
      }
    }
    
    console.log('✅ Content seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Content seeding failed:', error);
    process.exit(1);
  }
}

seedContent();