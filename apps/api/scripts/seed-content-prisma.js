#!/usr/bin/env node

/**
 * Content Seeding Script for Prisma
 * 
 * This script seeds the database with courses, modules, lessons, and quizzes
 * using Prisma instead of Sequelize.
 */

/* eslint-disable no-undef */
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedContent() {
  try {
    console.log('🔄 Starting content seeding with Prisma...');
    
    // Load registry to get module information
    const registryPath = path.join(__dirname, '../../../content/registry.json');
    if (!fs.existsSync(registryPath)) {
      throw new Error(`Registry file not found at ${registryPath}`);
    }
    
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    console.log(`Found ${registry.modules.length} modules in registry`);
    
    // Track seeding statistics
    let coursesCreated = 0;
    let coursesUpdated = 0;
    let modulesCreated = 0;
    let modulesUpdated = 0;
    let lessonsCreated = 0;
    let lessonsUpdated = 0;
    let quizzesCreated = 0;
    let quizzesUpdated = 0;
    
    // Ensure default academy exists
    let defaultAcademy = await prisma.academy.findUnique({
      where: { slug: 'glasscode-academy' }
    });
    
    if (!defaultAcademy) {
      defaultAcademy = await prisma.academy.create({
        data: {
          name: 'GlassCode Academy',
          slug: 'glasscode-academy',
          description: 'Default GlassCode Academy',
          isPublished: true,
          version: '1.0.0',
        }
      });
      console.log('Created default academy with ID:', defaultAcademy.id);
    } else {
      console.log('Default academy already exists with ID:', defaultAcademy.id);
    }
    
    // Process each module in the registry
    for (const moduleInfo of registry.modules) {
      console.log(`\nProcessing module: ${moduleInfo.slug} (${moduleInfo.title})`);
      
      // Load module content
      const modulePath = path.join(__dirname, `../../../content/lessons/${moduleInfo.slug}.json`);
      if (!fs.existsSync(modulePath)) {
        console.warn(`  ⚠️  Module file not found: ${modulePath}`);
        continue;
      }
      
      const moduleContent = JSON.parse(fs.readFileSync(modulePath, 'utf8'));
      
      // Create or update course
      const courseSlug = moduleInfo.slug.split('-')[0] + '-fundamentals';
      let course = await prisma.course.findUnique({
        where: { slug: courseSlug }
      });
      
      if (!course) {
        course = await prisma.course.create({
          data: {
            academyId: defaultAcademy.id,
            title: moduleInfo.slug === 'programming-fundamentals' 
              ? 'Programming Fundamentals with JavaScript' 
              : `${moduleInfo.track} Fundamentals`,
            description: moduleInfo.slug === 'programming-fundamentals' 
              ? 'Learn core programming concepts using JavaScript' 
              : null,
            slug: courseSlug,
            isPublished: true,
            order: registry.modules.indexOf(moduleInfo) + 1,
            difficulty: 'Beginner',
            version: '1.0.0'
          }
        });
        coursesCreated++;
        console.log(`  ✅ Created course: ${course.title}`);
      } else {
        course = await prisma.course.update({
          where: { id: course.id },
          data: {
            academyId: defaultAcademy.id,
            title: moduleInfo.slug === 'programming-fundamentals' 
              ? 'Programming Fundamentals with JavaScript' 
              : `${moduleInfo.track} Fundamentals`,
            description: moduleInfo.slug === 'programming-fundamentals' 
              ? 'Learn core programming concepts using JavaScript' 
              : null,
            isPublished: true,
            order: registry.modules.indexOf(moduleInfo) + 1
          }
        });
        coursesUpdated++;
        console.log(`  🔄 Updated course: ${course.title}`);
      }
      
      // Create or update module
      let module = await prisma.module.findUnique({
        where: { slug: moduleInfo.slug }
      });
      
      if (!module) {
        module = await prisma.module.create({
          data: {
            academyId: defaultAcademy.id,
            courseId: course.id,
            title: moduleInfo.title,
            slug: moduleInfo.slug,
            isPublished: true,
            order: moduleInfo.order || 1,
            version: '1.0.0'
          }
        });
        modulesCreated++;
        console.log(`  ✅ Created module: ${module.title}`);
      } else {
        module = await prisma.module.update({
          where: { id: module.id },
          data: {
            academyId: defaultAcademy.id,
            courseId: course.id,
            title: moduleInfo.title,
            isPublished: true,
            order: moduleInfo.order || 1
          }
        });
        modulesUpdated++;
        console.log(`  🔄 Updated module: ${module.title}`);
      }
      
      // Create or update lessons
      if (Array.isArray(moduleContent)) {
        for (let i = 0; i < moduleContent.length; i++) {
          const lessonInfo = moduleContent[i];
          const lessonSlug = `${moduleInfo.slug}-lesson-${i + 1}`;
          
          let lesson = await prisma.lesson.findUnique({
            where: { slug: lessonSlug }
          });
          
          if (!lesson) {
            lesson = await prisma.lesson.create({
              data: {
                academyId: defaultAcademy.id,
                moduleId: module.id,
                title: lessonInfo.title || `Lesson ${i + 1}`,
                slug: lessonSlug,
                order: i + 1,
                content: lessonInfo.content || lessonInfo,
                isPublished: true,
                difficulty: lessonInfo.difficulty || 'Beginner',
                estimatedMinutes: lessonInfo.estimatedTime || 10
              }
            });
            lessonsCreated++;
            console.log(`    ✅ Created lesson: ${lesson.title}`);
          } else {
            lesson = await prisma.lesson.update({
              where: { id: lesson.id },
              data: {
                academyId: defaultAcademy.id,
                moduleId: module.id,
                title: lessonInfo.title || `Lesson ${i + 1}`,
                content: lessonInfo.content || lessonInfo,
                isPublished: true,
                difficulty: lessonInfo.difficulty || 'Beginner',
                estimatedMinutes: lessonInfo.estimatedTime || 10
              }
            });
            lessonsUpdated++;
            console.log(`    🔄 Updated lesson: ${lesson.title}`);
          }
        }
      }
      
      // Load and create quizzes
      const quizPath = path.join(__dirname, `../../../content/quizzes/${moduleInfo.slug}.json`);
      if (fs.existsSync(quizPath)) {
        const quizContent = JSON.parse(fs.readFileSync(quizPath, 'utf8'));
        
        if (quizContent.questions && Array.isArray(quizContent.questions)) {
          for (let i = 0; i < quizContent.questions.length; i++) {
            const questionInfo = quizContent.questions[i];
            
            // Check if quiz question already exists
            const existingQuiz = await prisma.lessonQuiz.findFirst({
              where: {
                question: questionInfo.question,
                moduleId: module.id
              }
            });
            
            if (!existingQuiz) {
              await prisma.lessonQuiz.create({
                data: {
                  academyId: defaultAcademy.id,
                  moduleId: module.id,
                  question: questionInfo.question,
                  topic: moduleInfo.track,
                  difficulty: questionInfo.difficulty || 'Beginner',
                  choices: questionInfo.choices ? JSON.stringify(questionInfo.choices) : null,
                  fixedChoiceOrder: questionInfo.fixedChoiceOrder || false,
                  choiceLabels: questionInfo.choiceLabels ? JSON.stringify(questionInfo.choiceLabels) : null,
                  acceptedAnswers: questionInfo.acceptedAnswers ? JSON.stringify(questionInfo.acceptedAnswers) : null,
                  explanation: questionInfo.explanation || null,
                  industryContext: questionInfo.industryContext || null,
                  tags: questionInfo.tags ? JSON.stringify(questionInfo.tags) : null,
                  questionType: questionInfo.type || 'multiple-choice',
                  estimatedTime: questionInfo.estimatedTime || 1,
                  correctAnswer: questionInfo.correctAnswer !== undefined ? questionInfo.correctAnswer : null,
                  quizType: questionInfo.type || 'multiple-choice',
                  sources: questionInfo.sources ? JSON.stringify(questionInfo.sources) : null,
                  sortOrder: i + 1,
                  isPublished: true
                }
              });
              quizzesCreated++;
              console.log(`    ✅ Created quiz question: ${questionInfo.question.substring(0, 50)}...`);
            } else {
              await prisma.lessonQuiz.update({
                where: { id: existingQuiz.id },
                data: {
                  academyId: defaultAcademy.id,
                  moduleId: module.id,
                  question: questionInfo.question,
                  topic: moduleInfo.track,
                  difficulty: questionInfo.difficulty || 'Beginner',
                  choices: questionInfo.choices ? JSON.stringify(questionInfo.choices) : null,
                  fixedChoiceOrder: questionInfo.fixedChoiceOrder || false,
                  choiceLabels: questionInfo.choiceLabels ? JSON.stringify(questionInfo.choiceLabels) : null,
                  acceptedAnswers: questionInfo.acceptedAnswers ? JSON.stringify(questionInfo.acceptedAnswers) : null,
                  explanation: questionInfo.explanation || null,
                  industryContext: questionInfo.industryContext || null,
                  tags: questionInfo.tags ? JSON.stringify(questionInfo.tags) : null,
                  questionType: questionInfo.type || 'multiple-choice',
                  estimatedTime: questionInfo.estimatedTime || 1,
                  correctAnswer: questionInfo.correctAnswer !== undefined ? questionInfo.correctAnswer : null,
                  quizType: questionInfo.type || 'multiple-choice',
                  sources: questionInfo.sources ? JSON.stringify(questionInfo.sources) : null,
                  sortOrder: i + 1,
                  isPublished: true
                }
              });
              quizzesUpdated++;
              console.log(`    🔄 Updated quiz question: ${questionInfo.question.substring(0, 50)}...`);
            }
          }
        }
      }
    }
    
    // Print seeding statistics
    console.log('\n📊 Seeding Statistics:');
    console.log(`  Courses: ${coursesCreated} created, ${coursesUpdated} updated`);
    console.log(`  Modules: ${modulesCreated} created, ${modulesUpdated} updated`);
    console.log(`  Lessons: ${lessonsCreated} created, ${lessonsUpdated} updated`);
    console.log(`  Quizzes: ${quizzesCreated} created, ${quizzesUpdated} updated`);
    
    console.log('\n✅ Content seeding completed successfully with Prisma!');
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Content seeding failed:', error.message);
    console.error('Full error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the seeding function if this script is executed directly
if (require.main === module) {
  seedContent();
}

module.exports = seedContent;