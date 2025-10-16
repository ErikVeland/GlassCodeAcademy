#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define the modules and their corresponding slugs
const modules = [
  { dir: 'react', slug: 'react-fundamentals' },
  { dir: 'vue', slug: 'vue-fundamentals' },
  { dir: 'typescript', slug: 'typescript-fundamentals' },
  { dir: 'database', slug: 'database-fundamentals' },
  { dir: 'dotnet', slug: 'dotnet-fundamentals' },
  { dir: 'graphql', slug: 'graphql-fundamentals' },
  { dir: 'laravel', slug: 'laravel-fundamentals' },
  { dir: 'nextjs', slug: 'nextjs-fundamentals' },
  { dir: 'node', slug: 'node-fundamentals' },
  { dir: 'sass', slug: 'sass-fundamentals' },
  { dir: 'web', slug: 'web-fundamentals' },
  { dir: 'tailwind', slug: 'tailwind-fundamentals' },
  { dir: 'testing', slug: 'e2e-testing' },
  { dir: 'e2e', slug: 'e2e-testing' },
  { dir: 'security', slug: 'security-fundamentals' },
  { dir: 'performance', slug: 'performance-fundamentals' },
  { dir: 'programming', slug: 'programming-fundamentals' },
  { dir: 'programming-fundamentals', slug: 'programming-fundamentals' },
  { dir: 'version', slug: 'version-control' }
];

const appDir = '/Users/veland/GlassCodeAcademy/glasscode/frontend/src/app';

// Template for main page
function createMainPageContent(moduleDir, moduleSlug) {
  return `import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { contentRegistry } from '@/lib/contentRegistry';
import type { Module, Lesson, Quiz } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('${moduleSlug}');
  
  if (!currentModule) {
    return {
      title: 'Module Not Found',
    };
  }

  return {
    title: \`\${currentModule.title} - Fullstack Learning Platform\`,
    description: currentModule.description,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function ${moduleDir.charAt(0).toUpperCase() + moduleDir.slice(1)}Page() {
  const moduleSlug = '${moduleSlug}';
  
  // Add error handling for content registry
  let currentModule: Module | null = null;
  let tier = null;
  let thresholds = { lessons: false, lessonsValid: false, quiz: false, quizValid: false, overall: false };
  let lessons: Lesson[] = [];
  let quiz: Quiz | null = null;
  
  try {
    currentModule = await contentRegistry.getModule(moduleSlug);
    
    if (!currentModule) {
      notFound();
    }

    tier = await contentRegistry.getModuleTier(currentModule.slug);
    thresholds = await contentRegistry.checkModuleThresholds(currentModule.slug);
    lessons = await contentRegistry.getModuleLessons(currentModule.slug);
    quiz = await contentRegistry.getModuleQuiz(currentModule.slug);
  } catch (error) {
    console.error('Error loading module data:', error);
    notFound();
  }

  const hasMinimumLessons = lessons && lessons.length >= 3;
  const hasMinimumQuestions = quiz && quiz.questions && quiz.questions.length >= 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {currentModule.title}
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              {currentModule.description}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {currentModule.technologies.map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Module Status */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Lessons Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">📚 Lessons</h2>
              <p className="text-gray-300 mb-4">
                {lessons.length} lessons available
              </p>
              {thresholds.lessonsValid ? (
                <Link
                  href={\`/\${moduleSlug.replace('-fundamentals', '')}/lessons\`}
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Start Learning
                </Link>
              ) : (
                <div className="text-yellow-400">
                  <p className="mb-2">⚠️ Lessons not ready</p>
                  <p className="text-sm text-gray-400">
                    Minimum 3 lessons required ({lessons.length} available)
                  </p>
                </div>
              )}
            </div>

            {/* Quiz Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">🎯 Quiz</h2>
              <p className="text-gray-300 mb-4">
                {quiz?.questions?.length || 0} questions available
              </p>
              {thresholds.quizValid ? (
                <Link
                  href={\`/\${moduleSlug.replace('-fundamentals', '')}/quiz\`}
                  className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Take Quiz
                </Link>
              ) : (
                <div className="text-yellow-400">
                  <p className="mb-2">⚠️ Quiz not ready</p>
                  <p className="text-sm text-gray-400">
                    Minimum 5 questions required ({quiz?.questions?.length || 0} available)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Prerequisites */}
          {currentModule.prerequisites && currentModule.prerequisites.length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-8">
              <h3 className="text-xl font-bold text-white mb-4">📋 Prerequisites</h3>
              <div className="grid gap-2">
                {currentModule.prerequisites.map((prereq) => (
                  <PrerequisiteLink key={prereq} slug={prereq} />
                ))}
              </div>
            </div>
          )}

          {/* Module Tier Info */}
          {tier && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">🎓 Module Information</h3>
              <div className="grid md:grid-cols-2 gap-4 text-gray-300">
                <div>
                  <strong>Tier:</strong> {tier.name}
                </div>
                <div>
                  <strong>Difficulty:</strong> {tier.difficulty}
                </div>
                <div className="md:col-span-2">
                  <strong>Description:</strong> {tier.description}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

async function PrerequisiteLink({ slug }: { slug: string }) {
  const prereqModule = await contentRegistry.getModule(slug);
  if (!prereqModule) return null;

  return (
    <Link
      href={\`/modules/\${slug}\`}
      className="text-purple-400 hover:text-purple-300 underline"
    >
      {prereqModule.title}
    </Link>
  );
}
`;
}

// Template for lessons page
function createLessonsPageContent(moduleDir, moduleSlug) {
  return `import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { contentRegistry, getLessonGroups } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('${moduleSlug}');
  
  if (!currentModule) {
    return {
      title: 'Lessons Not Found',
    };
  }

  return {
    title: \`\${currentModule.title} Lessons - Fullstack Learning Platform\`,
    description: \`Learn \${currentModule.title} through structured lessons and practical examples.\`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function ${moduleDir.charAt(0).toUpperCase() + moduleDir.slice(1)}LessonsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = (searchParams ? await searchParams : {}) || {};
  const selectedTopic = typeof sp.topic === 'string' ? sp.topic : Array.isArray(sp.topic) ? sp.topic[0] : undefined;
  const moduleSlug = '${moduleSlug}';
  const currentModule = await contentRegistry.getModule(moduleSlug);
  
  if (!currentModule) {
    notFound();
  }

  const lessons = await contentRegistry.getModuleLessons(currentModule.slug);
  const thresholds = await contentRegistry.checkModuleThresholds(currentModule.slug);
  let lessonGroups = getLessonGroups(currentModule.slug, lessons);

  if (!thresholds.lessonsValid && process.env.NODE_ENV === 'production') {
    notFound();
  }

  // Filter lessons by topic if selected
  if (selectedTopic) {
    lessonGroups = lessonGroups.filter(group => 
      group.topic.toLowerCase().replace(/\\s+/g, '-') === selectedTopic
    );
  }

  // Get unique topics for filter
  const allTopics = Array.from(new Set(
    getLessonGroups(currentModule.slug, lessons).map(group => group.topic)
  ));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Link
              href={\`/\${moduleSlug.replace('-fundamentals', '')}\`}
              className="inline-block text-purple-400 hover:text-purple-300 mb-4"
            >
              ← Back to {currentModule.title}
            </Link>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {currentModule.title} Lessons
            </h1>
            <p className="text-xl text-gray-300">
              Master {currentModule.title} through structured learning
            </p>
          </div>

          {/* Topic Filter */}
          {allTopics.length > 1 && (
            <div className="mb-8">
              <div className="flex flex-wrap gap-2 justify-center">
                <Link
                  href={\`/\${moduleSlug.replace('-fundamentals', '')}/lessons\`}
                  className={\`px-4 py-2 rounded-lg transition-colors \${
                    !selectedTopic
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }\`}
                >
                  All Topics
                </Link>
                {allTopics.map((topic) => {
                  const topicSlug = topic.toLowerCase().replace(/\\s+/g, '-');
                  return (
                    <Link
                      key={topic}
                      href={\`/\${moduleSlug.replace('-fundamentals', '')}/lessons?topic=\${topicSlug}\`}
                      className={\`px-4 py-2 rounded-lg transition-colors \${
                        selectedTopic === topicSlug
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }\`}
                    >
                      {topic}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lessons Grid */}
          <div className="space-y-8">
            {lessonGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6">{group.topic}</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.lessons.map((lesson) => (
                    <Link
                      key={lesson.id}
                      href={\`/modules/\${currentModule.slug}/lessons/\${lesson.order}\`}
                      className="block bg-white/10 hover:bg-white/20 rounded-lg p-4 border border-white/20 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {lesson.order}
                        </span>
                        <div>
                          <h3 className="font-semibold text-white mb-2">{lesson.title}</h3>
                          <p className="text-gray-300 text-sm">{lesson.description}</p>
                          {lesson.duration && (
                            <p className="text-purple-400 text-xs mt-2">
                              ⏱️ {lesson.duration} min
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {lessonGroups.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No lessons found for the selected topic.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`;
}

// Template for quiz page
function createQuizPageContent(moduleDir, moduleSlug) {
  return `import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { contentRegistry } from '@/lib/contentRegistry';
import QuizLayout from '@/components/QuizLayout';

export async function generateMetadata(): Promise<Metadata> {
  const mod = await contentRegistry.getModule('${moduleSlug}');
  
  if (!mod) {
    return {
      title: 'Quiz Not Found',
    };
  }

  return {
    title: \`\${mod.title} Quiz - Fullstack Learning Platform\`,
    description: \`Test your knowledge of \${mod.title} with comprehensive questions and scenarios.\`,
    keywords: mod.technologies.join(', '),
  };
}

export default async function ${moduleDir.charAt(0).toUpperCase() + moduleDir.slice(1)}QuizPage() {
  const moduleSlug = '${moduleSlug}';
  const currentModule = await contentRegistry.getModule(moduleSlug);
  
  if (!currentModule) {
    notFound();
  }
 
  const quiz = await contentRegistry.getModuleQuiz(currentModule.slug);
  const thresholds = await contentRegistry.checkModuleThresholds(currentModule.slug);

  if (!thresholds.quizValid && process.env.NODE_ENV === 'production') {
    notFound();
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <Link
              href={\`/\${moduleSlug.replace('-fundamentals', '')}\`}
              className="inline-block text-purple-400 hover:text-purple-300 mb-8"
            >
              ← Back to {currentModule.title}
            </Link>
            <h1 className="text-4xl font-bold text-white mb-8">Quiz Not Available</h1>
            <p className="text-gray-300 text-lg">
              The quiz for {currentModule.title} is not yet available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Link
              href={\`/\${moduleSlug.replace('-fundamentals', '')}\`}
              className="inline-block text-purple-400 hover:text-purple-300 mb-4"
            >
              ← Back to {currentModule.title}
            </Link>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {currentModule.title} Quiz
            </h1>
            <p className="text-xl text-gray-300">
              Test your knowledge and skills
            </p>
          </div>

          {/* Quiz Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 mb-8">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  {quiz.questions.length}
                </div>
                <div className="text-gray-300">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {quiz.timeLimit || 'No Limit'}
                </div>
                <div className="text-gray-300">Time Limit</div>
              </div>
            </div>

            <div className="text-center">
              <Link
                href={\`/modules/\${currentModule.slug}/quiz/start\`}
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
              >
                Start Quiz
              </Link>
            </div>
          </div>

          {/* Quiz Description */}
          {quiz.description && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">About This Quiz</h2>
              <p className="text-gray-300">{quiz.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`;
}

function convertModule(moduleDir, moduleSlug) {
  const moduleBasePath = path.join(appDir, moduleDir);
  
  console.log(`Converting ${moduleDir} module...`);
  
  // Ensure directories exist
  if (!fs.existsSync(moduleBasePath)) {
    fs.mkdirSync(moduleBasePath, { recursive: true });
  }
  
  const lessonsPath = path.join(moduleBasePath, 'lessons');
  if (!fs.existsSync(lessonsPath)) {
    fs.mkdirSync(lessonsPath, { recursive: true });
  }
  
  const quizPath = path.join(moduleBasePath, 'quiz');
  if (!fs.existsSync(quizPath)) {
    fs.mkdirSync(quizPath, { recursive: true });
  }

  // Write main page
  fs.writeFileSync(
    path.join(moduleBasePath, 'page.tsx'),
    createMainPageContent(moduleDir, moduleSlug)
  );

  // Write lessons page
  fs.writeFileSync(
    path.join(lessonsPath, 'page.tsx'),
    createLessonsPageContent(moduleDir, moduleSlug)
  );

  // Write quiz page
  fs.writeFileSync(
    path.join(quizPath, 'page.tsx'),
    createQuizPageContent(moduleDir, moduleSlug)
  );

  console.log(`✅ Converted ${moduleDir} module`);
}

// Convert all modules
console.log('Starting module conversion...');
modules.forEach(({ dir, slug }) => {
  convertModule(dir, slug);
});

console.log('\n🎉 All modules converted successfully!');
console.log('\nThe following modules now use short URLs as primary routes:');
modules.forEach(({ dir, slug }) => {
  console.log(`  /${dir} -> ${slug}`);
});