import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { contentRegistry } from '@/lib/contentRegistry';
import type { Module } from '@/lib/contentRegistry';

interface ModulePageProps {
  params: Promise<{ moduleSlug: string }>;
}

export async function generateStaticParams() {
  const modules = await contentRegistry.getModules();
  return modules.map((module) => ({
    moduleSlug: module.slug,
  }));
}

export async function generateMetadata({ params }: ModulePageProps): Promise<Metadata> {
  const { moduleSlug } = await params;
  const module = await contentRegistry.getModule(moduleSlug);
  
  if (!module) {
    return {
      title: 'Module Not Found',
    };
  }

  return {
    title: `${module.title} - Fullstack Learning Platform`,
    description: module.description,
    keywords: module.technologies.join(', '),
  };
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { moduleSlug } = await params;
  
  // Add error handling for content registry
  let module: Module | null = null;
  let tier = null;
  let thresholds = { lessons: false, lessonsValid: false, quiz: false, quizValid: false, overall: false };
  let lessons: any[] = [];
  let quiz: any | null = null;
  
  try {
    module = await contentRegistry.getModule(moduleSlug);
    
    if (!module) {
      notFound();
    }

    tier = await contentRegistry.getTier(module.tier);
    thresholds = await contentRegistry.checkModuleThresholds(module.slug);
    lessons = await contentRegistry.getModuleLessons(module.slug);
    quiz = await contentRegistry.getModuleQuiz(module.slug);
  } catch (error) {
    console.error('Error loading module data:', error);
    // Return a more graceful error page
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="glass-morphism p-8 rounded-xl text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Content Unavailable</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We're having trouble loading the content for this module. This might be due to a temporary issue with our content registry.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
            <Link 
              href="/" 
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-center"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                Home
              </Link>
            </li>
            <li className="text-gray-500">/</li>
            <li>
              <span className="text-gray-500">
                {tier?.title} Tier
              </span>
            </li>
            <li className="text-gray-500">/</li>
            <li className="text-gray-900 dark:text-gray-100 font-medium">
              {module.title}
            </li>
          </ol>
        </nav>

        {/* Module Header */}
        <header className="mb-12">
          <div className="glass-morphism p-8 rounded-xl">
            <div className="flex items-start gap-6">
              <div className="text-6xl" role="img" aria-label={`${module.title} icon`}>
                {module.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                    {module.title}
                  </h1>
                  
                  <span className={`
                    px-3 py-1 rounded-full text-sm font-medium
                    ${module.difficulty === 'Beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      module.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}
                  `}>
                    {module.difficulty}
                  </span>
                </div>
                
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                  {module.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {module.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <span className="font-medium">Track:</span> {module.track}
                  </div>
                  <div>
                    <span className="font-medium">Tier:</span> {tier?.title}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {module.estimatedHours}h
                  </div>
                  <div>
                    <span className="font-medium">Lessons:</span> {lessons?.length || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Status Alert */}
        {module.status === 'content-pending' && (
          <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Content In Development
                </h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  This module is currently under development. Some content may be placeholder material.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Prerequisites */}
        {module.prerequisites.length > 0 && (
          <section className="mb-8">
            <div className="glass-morphism p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Prerequisites
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Before starting this module, make sure you've completed:
              </p>
              <ul className="space-y-2">
                {module.prerequisites.map((prereqSlug) => (
                  <li key={prereqSlug}>
                    <PrerequisiteLink slug={prereqSlug} />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Module Actions */}
        <section className="mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Lessons */}
            <div className="glass-morphism p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  📚 Lessons
                </h2>
                {lessons && (
                  <span className="text-sm text-gray-500">
                    {lessons.length} lessons
                  </span>
                )}
              </div>
              
              {thresholds.lessonsValid ? (
                <div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Learn the core concepts through structured lessons and practical examples.
                  </p>
                  <Link
                    href={module.routes.lessons}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Learning
                    <span className="ml-2">→</span>
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Lessons are being prepared for this module.
                  </p>
                  <button
                    disabled
                    className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              )}
            </div>

            {/* Quiz */}
            <div className="glass-morphism p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  🎯 Assessment
                </h2>
                {quiz && quiz.questions && (
                  <span className="text-sm text-gray-500">
                    {quiz.questions.length} questions
                  </span>
                )}
              </div>
              
              {thresholds.quizValid ? (
                <div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Test your knowledge with comprehensive questions and scenarios.
                  </p>
                  <Link
                    href={module.routes.quiz}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Take Quiz
                    <span className="ml-2">🎯</span>
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Assessment questions are being prepared for this module.
                  </p>
                  <button
                    disabled
                    className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Learning Objectives */}
        {tier && (
          <section className="mb-8">
            <div className="glass-morphism p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                🎯 Learning Objectives
              </h2>
              <ul className="space-y-2">
                {tier.learningObjectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <span className="text-gray-600 dark:text-gray-300">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    </>
  );
}

async function PrerequisiteLink({ slug }: { slug: string }) {
  try {
    const module = await contentRegistry.getModule(slug);
    
    if (!module) {
      return (
        <span className="text-gray-500 dark:text-gray-400">
          {slug} (module not found)
        </span>
      );
    }

    return (
      <Link
        href={module.routes.overview}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        <span>{module.icon}</span>
        <span>{module.title}</span>
      </Link>
    );
  } catch (error) {
    console.error('Error loading prerequisite module:', error);
    return (
      <span className="text-gray-500 dark:text-gray-400">
        {slug} (error loading module)
      </span>
    );
  }
}