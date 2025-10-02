#!/usr/bin/env node

/**
 * Content Scaffolding System
 * Generates missing lesson and quiz structures based on content registry
 */

const fs = require('fs');
const path = require('path');

class ContentScaffolder {
  constructor() {
    this.registry = null;
    this.contentDir = path.join(process.cwd(), 'content');
    this.lessonsDir = path.join(this.contentDir, 'lessons');
    this.quizzesDir = path.join(this.contentDir, 'quizzes');
    this.templatesDir = path.join(__dirname, 'templates');
  }

  loadRegistry() {
    const registryPath = path.join(this.contentDir, 'registry.json');
    
    if (!fs.existsSync(registryPath)) {
      console.error('❌ Content registry not found');
      return false;
    }

    try {
      const registryContent = fs.readFileSync(registryPath, 'utf8');
      this.registry = JSON.parse(registryContent);
      console.log(`✅ Loaded content registry with ${this.registry.modules.length} modules`);
      return true;
    } catch (error) {
      console.error('❌ Failed to parse content registry:', error.message);
      return false;
    }
  }

  ensureDirectories() {
    [this.lessonsDir, this.quizzesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });
  }

  generateLessonTemplate(module, lessonIndex) {
    const lessonId = `${module.slug}-lesson-${lessonIndex}`;
    const lessonTitle = this.generateLessonTitle(module, lessonIndex);
    
    return {
      id: lessonId,
      moduleSlug: module.slug,
      title: lessonTitle,
      order: lessonIndex,
      objectives: this.generateLearningObjectives(module, lessonIndex),
      intro: this.generateLessonIntro(module, lessonTitle),
      code: {
        example: this.generateCodeExample(module),
        explanation: "This example demonstrates the key concepts covered in this lesson."
      },
      pitfalls: this.generateCommonPitfalls(module),
      exercises: [
        {
          title: `Practice ${lessonTitle}`,
          description: `Apply the concepts learned in this lesson through hands-on practice.`,
          checkpoints: [
            "Complete the basic implementation",
            "Test your solution",
            "Identify areas for improvement"
          ]
        }
      ],
      next: [],
      estimatedMinutes: 30,
      difficulty: module.difficulty,
      tags: module.technologies.slice(0, 3),
      lastUpdated: new Date().toISOString(),
      version: "1.0.0"
    };
  }

  generateLessonTitle(module, lessonIndex) {
    const titleTemplates = {
      'foundational': [
        'Introduction to Concepts',
        'Basic Principles',
        'Getting Started',
        'Core Fundamentals',
        'Essential Patterns',
        'Building Blocks',
        'First Steps',
        'Understanding Basics',
        'Key Concepts',
        'Foundation Knowledge',
        'Practical Applications',
        'Review and Practice'
      ],
      'core': [
        'Core Architecture',
        'Advanced Patterns',
        'Best Practices',
        'Data Management',
        'State Handling',
        'Component Design',
        'API Integration',
        'Performance Basics',
        'Error Handling',
        'Security Fundamentals',
        'Testing Approaches',
        'Production Readiness'
      ],
      'specialized': [
        'Advanced Techniques',
        'Optimization Strategies',
        'Scalability Patterns',
        'Integration Approaches',
        'Custom Solutions',
        'Framework Mastery',
        'Advanced Configuration',
        'Performance Tuning',
        'Complex Scenarios',
        'Expert Patterns',
        'Professional Practices',
        'Mastery Assessment'
      ],
      'quality': [
        'Testing Fundamentals',
        'Quality Assurance',
        'Automated Testing',
        'Performance Testing',
        'Security Testing',
        'Code Quality',
        'Review Processes',
        'Continuous Integration',
        'Monitoring Setup',
        'Debugging Techniques',
        'Optimization Methods',
        'Quality Standards'
      ]
    };

    const templates = titleTemplates[module.tier] || titleTemplates['foundational'];
    const template = templates[lessonIndex - 1] || `Lesson ${lessonIndex}`;
    
    return `${template}`;
  }

  generateLearningObjectives(module, lessonIndex) {
    const objectiveTemplates = {
      1: [
        `Understand the fundamental concepts of ${module.title}`,
        `Identify key components and their relationships`,
        `Set up the development environment`
      ],
      2: [
        `Implement basic ${module.technologies[0]} patterns`,
        `Create simple applications using core concepts`,
        `Debug common issues effectively`
      ],
      3: [
        `Apply advanced ${module.technologies[0]} techniques`,
        `Optimize performance and efficiency`,
        `Integrate with external systems`
      ]
    };

    return objectiveTemplates[Math.min(lessonIndex, 3)] || [
      `Master key concepts from this lesson`,
      `Apply knowledge to practical scenarios`,
      `Prepare for advanced topics`
    ];
  }

  generateLessonIntro(module, lessonTitle) {
    return `Welcome to ${lessonTitle} in the ${module.title} module. 

This lesson is part of the ${module.tier} tier, designed for ${module.difficulty.toLowerCase()} level learners. Throughout this lesson, you'll explore essential concepts and practical applications that form the foundation of modern ${module.track.toLowerCase()} development.

${module.description} This lesson builds upon previous concepts while introducing new techniques that will enhance your understanding and practical skills.

By the end of this lesson, you'll have hands-on experience with ${module.technologies.slice(0, 2).join(' and ')}, along with best practices for implementing these technologies in real-world scenarios. The knowledge gained here will prepare you for more advanced topics in subsequent lessons.

Key areas we'll cover include practical implementation techniques, common challenges developers face, and proven solutions that industry professionals use daily. This lesson balances theoretical understanding with practical application, ensuring you can immediately apply what you learn.`;
  }

  generateCodeExample(module) {
    const codeTemplates = {
      'frontend': `// Example ${module.technologies[0]} implementation
// TODO: Add specific code example for ${module.title}

function example() {
    // Placeholder implementation
    console.log('${module.title} example');
}

export default example;`,
      'backend': `// Example ${module.technologies[0]} implementation
// TODO: Add specific code example for ${module.title}

public class Example
{
    public void DemonstrateCore${module.technologies[0].replace(/[^a-zA-Z]/g, '')}Concepts()
    {
        // Placeholder implementation
        Console.WriteLine("${module.title} example");
    }
}`,
      'database': `-- Example ${module.technologies[0]} query
-- TODO: Add specific database example for ${module.title}

SELECT * FROM examples 
WHERE module = '${module.slug}';`,
      'testing': `// Example ${module.technologies[0]} test
// TODO: Add specific test example for ${module.title}

describe('${module.title}', () => {
    it('should demonstrate core concepts', () => {
        // Test implementation
        expect(true).toBe(true);
    });
});`
    };

    return codeTemplates[module.category] || codeTemplates['frontend'];
  }

  generateCommonPitfalls(module) {
    return [
      {
        mistake: `Not following ${module.technologies[0]} best practices`,
        solution: `Review official documentation and established patterns for ${module.technologies[0]}`,
        severity: "medium"
      },
      {
        mistake: "Skipping error handling in implementation",
        solution: "Always implement proper error handling and validation",
        severity: "high"
      },
      {
        mistake: "Ignoring performance implications",
        solution: "Consider performance impact of your implementation choices",
        severity: "low"
      }
    ];
  }

  generateQuizTemplate(module) {
    const questionCount = module.thresholds.requiredQuestions || 15;
    const questions = [];

    for (let i = 0; i < questionCount; i++) {
      questions.push(this.generateQuizQuestion(module, i + 1));
    }

    return {
      moduleSlug: module.slug,
      title: `${module.title} Assessment`,
      description: `Comprehensive quiz covering key concepts from the ${module.title} module`,
      totalQuestions: questionCount,
      passingScore: 70,
      timeLimit: 30,
      questions: questions,
      metadata: {
        difficulty: module.difficulty,
        estimatedTime: `${Math.ceil(questionCount * 1.5)} minutes`,
        topics: module.technologies,
        lastUpdated: new Date().toISOString(),
        version: "1.0.0"
      }
    };
  }

  generateQuizQuestion(module, questionIndex) {
    const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
    const weights = { 'Beginner': 0.3, 'Intermediate': 0.5, 'Advanced': 0.2 };
    
    // Distribute difficulties based on weights
    let questionDifficulty;
    const rand = Math.random();
    if (rand < weights.Beginner) {
      questionDifficulty = 'Beginner';
    } else if (rand < weights.Beginner + weights.Intermediate) {
      questionDifficulty = 'Intermediate';
    } else {
      questionDifficulty = 'Advanced';
    }

    const questionTemplates = {
      'Beginner': [
        `What is the primary purpose of ${module.technologies[0]}?`,
        `Which of the following is a key feature of ${module.title}?`,
        `When should you use ${module.technologies[0]} in development?`
      ],
      'Intermediate': [
        `How do you implement ${module.technologies[0]} in a production environment?`,
        `What are the performance considerations when using ${module.technologies[0]}?`,
        `Which pattern is most effective for ${module.technologies[0]} architecture?`
      ],
      'Advanced': [
        `How would you optimize ${module.technologies[0]} for large-scale applications?`,
        `What are the trade-offs between different ${module.technologies[0]} approaches?`,
        `How do you troubleshoot complex ${module.technologies[0]} issues?`
      ]
    };

    const templates = questionTemplates[questionDifficulty];
    const questionText = templates[questionIndex % templates.length];

    return {
      id: `${module.slug}-q${questionIndex}`,
      question: questionText,
      topic: module.technologies[questionIndex % module.technologies.length],
      difficulty: questionDifficulty,
      choices: [
        "Option A - Placeholder answer",
        "Option B - Placeholder answer", 
        "Option C - Placeholder answer",
        "Option D - Placeholder answer"
      ],
      correctIndex: 0,
      explanation: `This question tests understanding of ${module.technologies[0]} concepts. The correct answer demonstrates proper implementation of ${module.title} principles. Review the lesson materials for detailed explanations of these concepts.`,
      industryContext: `In professional development, understanding ${module.technologies[0]} is crucial for building scalable and maintainable applications.`,
      tags: [module.tier, questionDifficulty.toLowerCase()],
      estimatedTime: 90
    };
  }

  async scaffoldModuleContent(module) {
    console.log(`\n🏗️  Scaffolding content for module: ${module.slug}`);
    
    // Generate lessons
    const lessonsPath = path.join(this.lessonsDir, `${module.slug}.json`);
    if (!fs.existsSync(lessonsPath)) {
      const lessons = [];
      const requiredLessons = module.thresholds.requiredLessons || 12;
      
      for (let i = 1; i <= requiredLessons; i++) {
        lessons.push(this.generateLessonTemplate(module, i));
      }
      
      fs.writeFileSync(lessonsPath, JSON.stringify(lessons, null, 2));
      console.log(`   📚 Generated ${requiredLessons} lesson templates`);
    } else {
      console.log(`   📚 Lessons file already exists`);
    }

    // Generate quiz
    const quizPath = path.join(this.quizzesDir, `${module.slug}.json`);
    if (!fs.existsSync(quizPath)) {
      const quiz = this.generateQuizTemplate(module);
      fs.writeFileSync(quizPath, JSON.stringify(quiz, null, 2));
      console.log(`   🎯 Generated quiz with ${quiz.questions.length} questions`);
    } else {
      console.log(`   🎯 Quiz file already exists`);
    }
  }

  async scaffoldAll() {
    console.log('🚀 Starting content scaffolding...\n');

    if (!this.loadRegistry()) {
      return false;
    }

    this.ensureDirectories();

    let scaffoldedCount = 0;
    for (const module of this.registry.modules) {
      if (module.status === 'content-pending') {
        await this.scaffoldModuleContent(module);
        scaffoldedCount++;
      } else {
        console.log(`⏭️  Skipping ${module.slug} (status: ${module.status})`);
      }
    }

    console.log(`\n✅ Scaffolding completed!`);
    console.log(`   📊 Processed ${scaffoldedCount} modules`);
    console.log(`   📁 Content generated in: ${this.contentDir}`);
    
    if (scaffoldedCount > 0) {
      console.log(`\n💡 Next steps:`);
      console.log(`   1. Review generated content templates`);
      console.log(`   2. Replace placeholder content with actual lessons`);
      console.log(`   3. Update quiz questions with real scenarios`);
      console.log(`   4. Run 'npm run validate-content' to check quality`);
    }

    return true;
  }

  async scaffoldModule(moduleSlug) {
    if (!this.loadRegistry()) {
      return false;
    }

    const module = this.registry.modules.find(m => m.slug === moduleSlug);
    if (!module) {
      console.error(`❌ Module not found: ${moduleSlug}`);
      return false;
    }

    this.ensureDirectories();
    await this.scaffoldModuleContent(module);
    
    console.log(`\n✅ Module ${moduleSlug} scaffolded successfully!`);
    return true;
  }
}

// CLI execution
if (require.main === module) {
  const scaffolder = new ContentScaffolder();
  
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Scaffold all modules
    scaffolder.scaffoldAll().catch(error => {
      console.error('💥 Scaffolding failed:', error);
      process.exit(1);
    });
  } else if (args.length === 1) {
    // Scaffold specific module
    const moduleSlug = args[0];
    scaffolder.scaffoldModule(moduleSlug).catch(error => {
      console.error('💥 Scaffolding failed:', error);
      process.exit(1);
    });
  } else {
    console.log('Usage:');
    console.log('  node scaffold-content.js              # Scaffold all content-pending modules');
    console.log('  node scaffold-content.js <moduleSlug> # Scaffold specific module');
    process.exit(1);
  }
}

module.exports = ContentScaffolder;