import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { contentRegistry } from '@/lib/contentRegistry';
import type { Module, Lesson, Quiz } from '@/lib/contentRegistry';
import { ui, classes } from '@/lib/ui';
import { getModuleTheme } from '@/lib/moduleThemes';
import RetryButton from '@/components/RetryButton';

export const dynamic = 'force-dynamic';

export async function generateStaticParams(): Promise<{ shortSlug: string }[]> {
  const enableSSG = process.env.ENABLE_BUILD_SSG === 'true';
  const isDb = (process.env.GC_CONTENT_MODE || '').toLowerCase() === 'db';
  if (!enableSSG || isDb) {
    return [];
  }
  try {
    const modules = await contentRegistry.getModules();
    const params = await Promise.all(modules.map(async (m: Module) => {
      const shortSlug = (await contentRegistry.getShortSlugFromModuleSlug(m.slug)) || m.slug;
      return { shortSlug };
    }));
    return params;
  } catch (error) {
    console.warn('Failed to load modules for overview static generation:', error);
    return [];
  }
}

type Props = {
  params: Promise<{ shortSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shortSlug } = await params;
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
  const { shortSlug } = await params;
  
  // Add error handling for content registry
  let currentModule: Module | null = null;
  let tier = null;
  let thresholds = { lessons: false, lessonsValid: false, quiz: false, quizValid: false, overall: false };
  let lessons: Lesson[] = [];
  let quiz: Quiz | null = null;
  
  try {
    currentModule = await contentRegistry.getModule(shortSlug);
    
    if (!currentModule) {
      console.log(`Module not found for shortSlug: ${shortSlug}`);
      notFound();
    }

    console.log(`Loading content for module: ${currentModule.slug}`);
    
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
    
    console.log(`Loaded content for module ${currentModule.slug}: ${lessons.length} lessons, ${quiz?.questions?.length || 0} quiz questions`);
  } catch (error) {
    console.error('Error loading module data:', error);
    // Return a more graceful error page
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="glass-morphism p-8 rounded-xl text-center">
          <h1 className="text-2xl font-bold text-danger mb-4">Content Unavailable</h1>
          <p className="text-muted mb-6">
            We&apos;re having trouble loading the content for this module. This might be due to a temporary issue with our content registry.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <RetryButton />
            <Link 
              href="/" 
              className="px-4 py-2 bg-surface-alt text-fg rounded-lg hover:opacity-90 transition-colors text-center"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const theme = getModuleTheme(currentModule!.slug);

  const difficultyBadgeClass = 'bg-surface-alt text-fg';

  return (
    <>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/" className="text-primary hover:opacity-90">
                Home
              </Link>
            </li>
            <li className="text-muted">/</li>
            <li>
              <span className="text-muted">
                {tier?.title} Tier
              </span>
            </li>
            <li className="text-muted">/</li>
            <li className="text-fg font-medium">
              {currentModule.title}
            </li>
          </ol>
        </nav>

        {/* Module Header */}
        <header className="mb-12">
          <div className="rounded-xl overflow-hidden">
            <div className={`h-2 ${theme.strip}`}></div>
            <div className="glass-morphism p-8">
              <div className="flex items-start gap-6">
                <div className="text-6xl" role="img" aria-label={`${currentModule.title} icon`}>
                  {currentModule.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <h1 className="text-4xl font-bold text-fg">
                      {currentModule.title}
                    </h1>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyBadgeClass}`}>
                      {currentModule.difficulty}
                    </span>
                  </div>
                  <p className="text-xl text-muted mb-6">
                    {currentModule.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {currentModule.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 bg-surface-alt text-fg rounded-full text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted">
                    <div>
                      <span className="font-medium">Track:</span> {currentModule.track}
                    </div>
                    <div>
                      <span className="font-medium">Tier:</span> {tier?.title}
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span> {currentModule.estimatedHours}h
                    </div>
                    <div>
                      <span className="font-medium">Lessons:</span> {lessons?.length || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Status Alert */}
        {currentModule.status === 'content-pending' && (
          <div className="mb-8 p-4 bg-surface-alt border border-border rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-warning text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-warning">
                  Content In Development
                </h3>
                <p className="mt-1 text-sm text-muted">
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
              <h2 className="text-xl font-semibold mb-4 text-fg">
                Prerequisites
              </h2>
              <p className="text-muted mb-4">
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
                <h2 className="text-xl font-semibold text-fg">
                  📚 Lessons
                </h2>
                {lessons && (
                  <span className="text-sm text-muted">
                    {lessons.length} lessons
                  </span>
                )}
              </div>
              
              {thresholds.lessonsValid ? (
                <div>
                  <p className="text-fg mb-4">
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
                  <p className="text-muted mb-4">
                    Lessons are being prepared for this module.
                  </p>
                  <button
                    disabled
                    className="inline-flex items-center px-4 py-2 bg-surface-alt text-muted rounded-lg cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              )}
            </div>

            {/* Quiz */}
            <div className="glass-morphism p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-fg">
                  🎯 Assessment
                </h2>
                {quiz && quiz.questions && (
                  <span className="text-sm text-muted">
                    {quiz.questions.length} questions
                  </span>
                )}
              </div>
              
              {thresholds.quizValid ? (
                <div>
                  <p className="text-fg mb-4">
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
                  <p className="text-muted mb-4">
                    Assessment questions are being prepared for this module.
                  </p>
                  <button
                    disabled
                    className="inline-flex items-center px-4 py-2 bg-surface-alt text-muted rounded-lg cursor-not-allowed"
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
              <h2 className="text-xl font-semibold mb-4 text-fg">
                🎯 Learning Objectives
              </h2>
              <ul className="space-y-2">
                {tier.learningObjectives.map((objective, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <span className="text-primary leading-none">✓</span>
                    <span className="text-fg leading-tight">{objective}</span>
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
        <span className="text-muted">
          {slug} (module not found)
        </span>
      );
    }

    return (
      <Link
        href={prereqModule.routes.overview}
        className="flex items-center gap-2 text-primary hover:opacity-90"
      >
        <span>{prereqModule.icon}</span>
        <span>{prereqModule.title}</span>
      </Link>
    );
  } catch (error) {
    console.error('Error loading prerequisite module:', error);
    return (
      <span className="text-muted">
        {slug} (error loading module)
      </span>
    );
  }
}