import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { contentRegistry } from '@/lib/contentRegistry';
import type { Module, Lesson, Quiz } from '@/lib/contentRegistry';
import { ui, classes } from '@/lib/ui';
import { getModuleTheme } from '@/lib/moduleThemes';



export const dynamic = 'force-dynamic';

export async function generateStaticParams(): Promise<{ shortSlug: string }[]> {
  if ((process.env.GC_CONTENT_MODE || '').toLowerCase() === 'db') {
    return [];
  }
  const modules = await contentRegistry.getModules();
  return modules.map((m: Module) => ({
    shortSlug: m.slug,
  }));
}

type Props = {
  params: { shortSlug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shortSlug } = params;
  const currentModule = await contentRegistry.getModule(shortSlug);
  
  if (!currentModule) {
    return {
      title: 'Module Not Found',
    };
  }

  return {
    title: `${currentModule.title} - Fullstack Learning Platform`,
    description: currentModule.description,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function ModulePage({ params }: Props) {
  const { shortSlug } = params;
  
  // Add error handling for content registry
  let currentModule: Module | null = null;
  let tier = null;
  let thresholds = { lessons: false, lessonsValid: false, quiz: false, quizValid: false, overall: false };
  let lessons: Lesson[] = [];
  let quiz: Quiz | null = null;
  
  try {
    currentModule = await contentRegistry.getModule(shortSlug);
    
    if (!currentModule) {
      notFound();
    }

    const [tierResolved, thresholdsResolved, lessonsResolved, quizResolved] = await Promise.all([
      contentRegistry.getTier(currentModule.tier),
      contentRegistry.checkModuleThresholds(currentModule.slug),
      contentRegistry.getModuleLessons(currentModule.slug),
      contentRegistry.getModuleQuiz(currentModule.slug),
    ]);
    tier = tierResolved;
    thresholds = thresholdsResolved as typeof thresholds;
    lessons = lessonsResolved;
    quiz = quizResolved;
  } catch (error) {
    console.error('Error loading module data:', error);
    // Return a more graceful error page
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="glass-morphism p-8 rounded-xl text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Content Unavailable</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We&apos;re having trouble loading the content for this module. This might be due to a temporary issue with our content registry.
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

  const theme = getModuleTheme(currentModule!.slug);

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
              {currentModule.title}
            </li>
          </ol>
        </nav>

        {/* Module Header */}
        <header className="mb-12">
          <div className="rounded-xl overflow-hidden">
            <div className={`h-2 ${theme.strip}`}></div>
            <div className="glass-morphism p-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {currentModule.title}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                {currentModule.description}
              </p>
            </div>
          </div>
        </header>

        {/* Content Status Alert */}
        {currentModule.status === 'content-pending' && (
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
        {currentModule.prerequisites.length > 0 && (
          <section className="mb-8">
            <div className="glass-morphism p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Prerequisites
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Before starting this module, make sure you&apos;ve completed:
              </p>
              <ul className="space-y-2">
                {currentModule.prerequisites.map((prereqSlug) => (
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
                    href={currentModule.routes.lessons}
                    className={classes(ui.buttons.base, 'px-4 py-2', ui.buttons.lessons)}
                  >
                    Start Learning
                    <span className="ml-2">→</span>
                  </Link>
                  {/* Topic shortcut chips removed per request to simplify module homepage */}
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
                    href={currentModule.routes.quiz}
                    className={classes(ui.buttons.base, 'px-4 py-2', ui.buttons.quiz)}
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
                  <li key={index} className="flex items-center gap-3">
                    <span className="text-green-500 leading-none">✓</span>
                    <span className="text-gray-600 dark:text-gray-300 leading-tight">{objective}</span>
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
    const prereqModule = await contentRegistry.getModule(slug);
    
    if (!prereqModule) {
      return (
        <span className="text-gray-500 dark:text-gray-400">
          {slug} (module not found)
        </span>
      );
    }

    return (
      <Link
        href={prereqModule.routes.overview}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        <span>{prereqModule.icon}</span>
        <span>{prereqModule.title}</span>
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