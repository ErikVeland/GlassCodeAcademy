import Link from 'next/link';
import {
  contentRegistry,
  getLessonGroupForLesson,
  getNextLessonGroup,
} from '@/lib/contentRegistry';
import { Metadata } from 'next';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';
import MarkdownContent from '@/components/MarkdownContent';
import CodeBlock from '@/components/CodeBlock';

interface LessonPageProps {
  params: Promise<{
    shortSlug: string;
    lessonOrder: string;
  }>;
}

// Explicit interfaces to avoid 'any' types in maps
interface Pitfall {
  mistake?: string;
  solution?: string;
  severity?: 'high' | 'medium' | 'low';
}

interface Exercise {
  title?: string;
  description?: string;
  checkpoints?: string[];
}

export const dynamic = 'force-dynamic';

export async function generateStaticParams(): Promise<
  { shortSlug: string; lessonOrder: string }[]
> {
  const enableSSG = process.env.ENABLE_BUILD_SSG === 'true';
  const isDb = (process.env.GC_CONTENT_MODE || '').toLowerCase() === 'db';
  if (!enableSSG || isDb) {
    return [];
  }
  try {
    const modules = await contentRegistry.getModules();
    const activeModules = modules.filter((m) => m.status === 'active');
    const params: { shortSlug: string; lessonOrder: string }[] = [];
    for (const m of activeModules) {
      const shortSlug =
        (await contentRegistry.getShortSlugFromModuleSlug(m.slug)) || m.slug;
      for (let i = 1; i <= 3; i++) {
        params.push({ shortSlug, lessonOrder: String(i) });
      }
    }
    return params;
  } catch (error) {
    console.warn('Failed to load modules for lesson static generation:', error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: LessonPageProps): Promise<Metadata> {
  const { shortSlug, lessonOrder } = await params;
  const currentModule =
    (await contentRegistry.getModule(shortSlug)) ||
    (await contentRegistry.getModule(
      (await contentRegistry.getModuleSlugFromShortSlug(shortSlug)) || shortSlug
    ));

  const fallbackTitle = 'Lesson';
  if (!currentModule) {
    return {
      title: `${fallbackTitle} - ${shortSlug}`,
    };
  }

  const lessons = await contentRegistry.getModuleLessons(currentModule.slug);
  const lessonIndex = parseInt(lessonOrder) - 1;
  const lesson = lessons?.[lessonIndex];

  if (!lesson) {
    return {
      title: `${fallbackTitle} - ${currentModule.title}`,
    };
  }

  return {
    title: `${lesson.title} - ${currentModule.title} Lessons`,
    description:
      lesson.intro?.substring(0, 160) ||
      `Learn ${lesson.title} in the ${currentModule.title} module.`,
    keywords: lesson.tags?.join(', ') || currentModule.technologies.join(', '),
  };
}

// Enable ISR for on-demand generation of lesson pages
export const revalidate = 0;
export const dynamicParams = true; // Allow dynamic params not in generateStaticParams

export default async function LessonPage({ params }: LessonPageProps) {
  const { shortSlug, lessonOrder } = await params;
  const mappedSlug =
    (await contentRegistry.getModuleSlugFromShortSlug(shortSlug)) || shortSlug;
  let currentModule =
    (await contentRegistry.getModule(shortSlug)) ||
    (await contentRegistry.getModule(mappedSlug));

  // Minimal fallback module when registry/API is unavailable
  if (!currentModule) {
    currentModule = {
      slug: mappedSlug,
      title: shortSlug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      description: '',
      tier: '',
      track: '',
      order: 1,
      icon: '',
      difficulty: 'beginner',
      estimatedHours: 0,
      category: '',
      technologies: [],
      prerequisites: [],
      thresholds: { requiredLessons: 0, requiredQuestions: 0 },
      legacySlugs: [],
      status: 'active',
      routes: {
        overview: `/${shortSlug}`,
        lessons: `/${shortSlug}/lessons`,
        quiz: `/${shortSlug}/quiz`,
      },
      metadata: {},
    };
  }

  let lessons = await contentRegistry.getModuleLessons(currentModule.slug);
  if (
    (!lessons || lessons.length === 0) &&
    mappedSlug === 'programming-fundamentals'
  ) {
    lessons = await contentRegistry.getProgrammingLessons();
  }

  const lessonIndex = parseInt(lessonOrder) - 1;
  let lesson = lessons?.[lessonIndex];

  // Fallback placeholder lesson when specific lesson not available
  if (!lesson) {
    lesson = {
      order: lessonIndex + 1,
      title: 'Lesson temporarily unavailable',
      intro: 'This lesson content is still loading. Please try again shortly.',
      objectives: [],
      tags: ['fallback'],
    };
  }

  // Get lesson groups and current group info (may be null on fallback)
  const currentGroupInfo = getLessonGroupForLesson(
    currentModule.slug,
    lessons || [],
    lessonIndex + 1
  );
  const nextGroup = getNextLessonGroup(
    currentModule.slug,
    lessons || [],
    lessonIndex + 1
  );

  // Determine if this is the last lesson in its group
  const isLastInGroup = !!(
    currentGroupInfo &&
    currentGroupInfo.group.lessons[
      currentGroupInfo.group.lessons.length - 1
    ] === lesson
  );
  const isFirstInGroup = !!(
    currentGroupInfo && currentGroupInfo.group.lessons[0] === lesson
  );

  return (
    <>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation />

        {/* Lesson Header */}
        <header className="mb-8">
          <div className="glass-morphism rounded-xl overflow-hidden">
            {/* Progress bar */}
            <div className="h-1 bg-border">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${Math.round(((lessonIndex + 1) / (lessons.length || 1)) * 100)}%`,
                }}
              />
            </div>

            <div className="p-8">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-4">
                  <span className="flex items-center justify-center w-12 h-12 bg-primary text-primary-fg rounded-full text-lg font-bold shrink-0">
                    {lesson.order || lessonIndex + 1}
                  </span>
                  <div>
                    <p className="text-xs text-muted uppercase tracking-widest mb-1">
                      {currentModule.title}
                      {currentGroupInfo?.group.title
                        ? ` · ${currentGroupInfo.group.title}`
                        : ''}
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-fg leading-tight">
                      {lesson.title}
                    </h1>
                  </div>
                </div>

                <div className="text-sm text-muted shrink-0 pt-1">
                  <span className="flex items-center gap-1.5 bg-surface-alt px-3 py-1.5 rounded-full">
                    <span>🕒</span>
                    <span>{lesson.estimatedMinutes || 30} min</span>
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted ml-16">
                Lesson {lesson.order || lessonIndex + 1} of {lessons.length}
              </p>

              {/* Learning Objectives */}
              {lesson.objectives && lesson.objectives.length > 0 && (
                <div className="border-t border-border mt-6 pt-6">
                  <h2 className="text-sm font-semibold text-muted uppercase tracking-widest mb-3">
                    Learning Objectives
                  </h2>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {lesson.objectives.map(
                      (objective: string, index: number) => (
                        <li key={index} className="flex items-start gap-2.5">
                          <span className="text-primary mt-0.5 shrink-0">
                            ✓
                          </span>
                          <span className="text-fg text-sm">{objective}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Lesson Content */}
        <main className="space-y-8">
          {/* Introduction */}
          {lesson.intro && (
            <section className="glass-morphism p-8 rounded-xl">
              <h2 className="text-2xl font-semibold text-fg mb-4">
                Introduction
              </h2>
              <MarkdownContent content={lesson.intro} />
            </section>
          )}

          {/* Code Example */}
          {lesson.code && lesson.code.example && (
            <section className="glass-morphism p-8 rounded-xl">
              <h2 className="text-2xl font-semibold text-fg mb-4">
                💻 Code Example
              </h2>

              <CodeBlock
                code={lesson.code.example}
                languageHint={currentModule.technologies?.[0]}
                className="mb-4"
              />

              {lesson.code.explanation && (
                <div className="text-fg mt-5 pt-5 border-t border-border">
                  <h3 className="font-semibold mb-2 text-muted uppercase text-xs tracking-widest">
                    Explanation
                  </h3>
                  <MarkdownContent content={lesson.code.explanation} />
                </div>
              )}
            </section>
          )}

          {/* Common Pitfalls */}
          {lesson.pitfalls && lesson.pitfalls.length > 0 && (
            <section className="glass-morphism p-8 rounded-xl">
              <h2 className="text-2xl font-semibold text-fg mb-4">
                ⚠️ Common Pitfalls
              </h2>

              <div className="space-y-4">
                {lesson.pitfalls.map((pitfall: Pitfall, index: number) => (
                  <div
                    key={index}
                    className="border border-border bg-surface-alt rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-warning text-xl mt-1">⚠️</span>
                      <div>
                        <h3 className="font-semibold text-warning mb-2">
                          {pitfall.mistake || `Pitfall ${index + 1}`}
                        </h3>
                        <p className="text-muted mb-2">
                          <strong>Solution:</strong>{' '}
                          {pitfall.solution ||
                            'Review best practices and documentation.'}
                        </p>
                        {pitfall.severity && (
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium bg-surface-alt text-muted`}
                          >
                            {pitfall.severity} severity
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Exercises */}
          {lesson.exercises && lesson.exercises.length > 0 && (
            <section className="glass-morphism p-8 rounded-xl">
              <h2 className="text-2xl font-semibold text-fg mb-4">
                📝 Practice Exercises
              </h2>

              <div className="space-y-6">
                {lesson.exercises.map((exercise: Exercise, index: number) => (
                  <div
                    key={index}
                    className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6"
                  >
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                      {exercise.title || `Exercise ${index + 1}`}
                    </h3>

                    {exercise.description && (
                      <MarkdownContent
                        content={exercise.description}
                        className="text-blue-800 dark:text-blue-200 mb-4"
                      />
                    )}

                    {exercise.checkpoints &&
                      exercise.checkpoints.length > 0 && (
                        <div>
                          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                            Checkpoints:
                          </h4>
                          <ul className="space-y-1">
                            {exercise.checkpoints.map(
                              (checkpoint: string, checkIndex: number) => (
                                <li
                                  key={checkIndex}
                                  className="flex items-center gap-2"
                                >
                                  <span className="w-4 h-4 border-2 border-blue-400 rounded"></span>
                                  <span className="text-blue-700 dark:text-blue-300">
                                    {checkpoint}
                                  </span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Navigation */}
        <nav className="mt-12 glass-morphism rounded-xl p-4 flex justify-between items-center gap-4">
          <div>
            {isFirstInGroup ? (
              <Link
                href={
                  currentModule.slug === 'programming-fundamentals'
                    ? '/programming/lessons'
                    : currentModule.routes.lessons
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:text-fg border border-border rounded-lg hover:bg-surface-alt transition-all"
              >
                <span>←</span>
                <span>All Lessons</span>
              </Link>
            ) : (
              <Link
                href={
                  currentModule.slug === 'programming-fundamentals'
                    ? `/programming/lessons/${lessonIndex}`
                    : `${currentModule.routes.lessons}/${lessonIndex}`
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:text-fg border border-border rounded-lg hover:bg-surface-alt transition-all"
              >
                <span>←</span>
                <span>Previous</span>
              </Link>
            )}
          </div>

          <div className="text-xs text-muted">
            {lessonIndex + 1} / {lessons.length}
          </div>

          <div>
            {isLastInGroup ? (
              nextGroup ? (
                <Link
                  href={
                    currentModule.slug === 'programming-fundamentals'
                      ? `/programming/lessons/${lessons.indexOf(nextGroup.lessons[0]) + 1}`
                      : `${currentModule.routes.lessons}/${lessons.indexOf(nextGroup.lessons[0]) + 1}`
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm bg-primary text-primary-fg rounded-lg hover:opacity-90 transition-all font-medium"
                >
                  <span>{nextGroup.title}</span>
                  <span>→</span>
                </Link>
              ) : (
                <Link
                  href={
                    currentModule.slug === 'programming-fundamentals'
                      ? '/programming/quiz'
                      : currentModule.routes.quiz
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm bg-success text-primary-fg rounded-lg hover:opacity-90 transition-all font-medium"
                >
                  <span>Take Assessment</span>
                  <span>🎯</span>
                </Link>
              )
            ) : (
              <Link
                href={
                  currentModule.slug === 'programming-fundamentals'
                    ? `/programming/lessons/${lessonIndex + 2}`
                    : `${currentModule.routes.lessons}/${lessonIndex + 2}`
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm bg-primary text-primary-fg rounded-lg hover:opacity-90 transition-all font-medium"
              >
                <span>Next Lesson</span>
                <span>→</span>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
