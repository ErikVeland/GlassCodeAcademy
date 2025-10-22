import Link from 'next/link';
import { contentRegistry, getLessonGroupForLesson, getNextLessonGroup } from '@/lib/contentRegistry';
import { Metadata } from 'next';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';

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

export async function generateStaticParams() {
  const isDb = (process.env.GC_CONTENT_MODE || '').toLowerCase() === 'db';
  if (isDb) {
    // No pre-generation in DB mode; render on-demand
    return [];
  }
  try {
    const modules = await contentRegistry.getModules();
    const params: Array<{ shortSlug: string; lessonOrder: string }> = [];
    // Only pre-generate the first 3 lessons of each module to reduce build time
    for (const mod of modules) {
      if (mod.status === 'active') {
        try {
          const lessons = await contentRegistry.getModuleLessons(mod.slug);
          if (lessons) {
            const lessonsToGenerate = Math.min(3, lessons.length);
            // Use short slug for friendly routes where available
            const shortSlug = (await contentRegistry.getShortSlugFromModuleSlug(mod.slug)) || mod.slug;
            for (let i = 0; i < lessonsToGenerate; i++) {
              params.push({ shortSlug, lessonOrder: (i + 1).toString() });
            }
          }
        } catch (lessonError) {
          console.warn(`Failed to load lessons for module ${mod.slug}:`, lessonError);
        }
      }
    }
    console.log(`Generating ${params.length} lesson pages statically`);
    return params;
  } catch (error) {
    console.warn('Failed to load modules for lesson static generation:', error);
    return [];
  }
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { shortSlug, lessonOrder } = await params;
  const currentModule = await contentRegistry.getModule(shortSlug) 
    || await contentRegistry.getModule(await contentRegistry.getModuleSlugFromShortSlug(shortSlug) || shortSlug);
  
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
    description: lesson.intro?.substring(0, 160) || `Learn ${lesson.title} in the ${currentModule.title} module.`,
    keywords: lesson.tags?.join(', ') || currentModule.technologies.join(', '),
  };
}

// Enable ISR for on-demand generation of lesson pages
export const revalidate = 0;
export const dynamicParams = true; // Allow dynamic params not in generateStaticParams

export default async function LessonPage({ params }: LessonPageProps) {
  const { shortSlug, lessonOrder } = await params;
  const mappedSlug = await contentRegistry.getModuleSlugFromShortSlug(shortSlug) || shortSlug;
  let currentModule = await contentRegistry.getModule(shortSlug) || await contentRegistry.getModule(mappedSlug);
  
  // Minimal fallback module when registry/API is unavailable
  if (!currentModule) {
    currentModule = {
      slug: mappedSlug,
      title: shortSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
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
      routes: { overview: `/${shortSlug}`, lessons: `/${shortSlug}/lessons`, quiz: `/${shortSlug}/quiz` },
      metadata: {}
    };
  }

  let lessons = await contentRegistry.getModuleLessons(currentModule.slug);
  if ((!lessons || lessons.length === 0) && mappedSlug === 'programming-fundamentals') {
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
      tags: ['fallback']
    };
  }

  // Get lesson groups and current group info (may be null on fallback)
  const currentGroupInfo = getLessonGroupForLesson(currentModule.slug, lessons || [], lessonIndex + 1);
  const nextGroup = getNextLessonGroup(currentModule.slug, lessons || [], lessonIndex + 1);
  
  // Determine if this is the last lesson in its group
  const isLastInGroup = !!(currentGroupInfo && currentGroupInfo.group.lessons[currentGroupInfo.group.lessons.length - 1] === lesson);
  const isFirstInGroup = !!(currentGroupInfo && currentGroupInfo.group.lessons[0] === lesson);

  return (
    <>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation />

        {/* Lesson Header */}
        <header className="mb-8">
          <div className="glass-morphism p-8 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-lg font-bold">
                  {lesson.order || lessonIndex + 1}
                </span>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {lesson.title}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    {currentModule.title} • {currentGroupInfo?.group.title} • Lesson {lesson.order || lessonIndex + 1} of {lessons.length}
                  </p>
                </div>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  🕒 {lesson.estimatedMinutes || 30} minutes
                </span>
              </div>
            </div>

            {/* Learning Objectives */}
            {lesson.objectives && lesson.objectives.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  🎯 Learning Objectives
                </h2>
                <ul className="space-y-2">
                  {lesson.objectives.map((objective: string, index: number) => (
                    <li key={index} className="flex items-center gap-3">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </header>

        {/* Lesson Content */}
        <main className="space-y-8">
          {/* Introduction */}
          {lesson.intro && (
            <section className="glass-morphism p-8 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Introduction
              </h2>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                {lesson.intro.split('\n\n').map((paragraph: string, index: number) => (
                  <p key={index} className="text-gray-700 dark:text-gray-300 mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Code Example */}
          {lesson.code && lesson.code.example && (
            <section className="glass-morphism p-8 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                💻 Code Example
              </h2>
              
              <div className="bg-gray-900 rounded-lg p-6 mb-4 overflow-x-auto">
                <pre className="text-sm text-gray-100">
                  <code>{lesson.code.example}</code>
                </pre>
              </div>
              
              {lesson.code.explanation && (
                <div className="text-gray-700 dark:text-gray-300">
                  <h3 className="font-semibold mb-2">Explanation:</h3>
                  <p>{lesson.code.explanation}</p>
                </div>
              )}
            </section>
          )}

          {/* Common Pitfalls */}
          {lesson.pitfalls && lesson.pitfalls.length > 0 && (
            <section className="glass-morphism p-8 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                ⚠️ Common Pitfalls
              </h2>
              
              <div className="space-y-4">
                {lesson.pitfalls.map((pitfall: Pitfall, index: number) => (
                  <div key={index} className="border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-yellow-500 text-xl mt-1">⚠️</span>
                      <div>
                        <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                          {pitfall.mistake || `Pitfall ${index + 1}`}
                        </h3>
                        <p className="text-yellow-700 dark:text-yellow-300 mb-2">
                          <strong>Solution:</strong> {pitfall.solution || 'Review best practices and documentation.'}
                        </p>
                        {pitfall.severity && (
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            pitfall.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            pitfall.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
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
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                📝 Practice Exercises
              </h2>
              
              <div className="space-y-6">
                {lesson.exercises.map((exercise: Exercise, index: number) => (
                  <div key={index} className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                      {exercise.title || `Exercise ${index + 1}`}
                    </h3>
                    
                    {exercise.description && (
                      <p className="text-blue-800 dark:text-blue-200 mb-4">
                        {exercise.description}
                      </p>
                    )}
                    
                    {exercise.checkpoints && exercise.checkpoints.length > 0 && (
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                          Checkpoints:
                        </h4>
                        <ul className="space-y-1">
                          {exercise.checkpoints.map((checkpoint: string, checkIndex: number) => (
                            <li key={checkIndex} className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-blue-400 rounded"></span>
                              <span className="text-blue-700 dark:text-blue-300">{checkpoint}</span>
                            </li>
                          ))}
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
        <nav className="mt-12 flex justify-between items-center">
          <div>
            {isFirstInGroup ? (
              <Link
                href={currentModule.slug === 'programming-fundamentals' ? '/programming/lessons' : currentModule.routes.lessons}
                className="inline-flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← Back to Lessons
              </Link>
            ) : (
              <Link
                href={currentModule.slug === 'programming-fundamentals' ? `/programming/lessons/${lessonIndex}` : `${currentModule.routes.lessons}/${lessonIndex}`} // Previous lesson
                className="inline-flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← Previous Lesson
              </Link>
            )}
          </div>
          
          <div>
            {isLastInGroup ? (
              nextGroup ? (
                <Link
                  href={currentModule.slug === 'programming-fundamentals' ? `/programming/lessons/${lessons.indexOf(nextGroup.lessons[0]) + 1}` : `${currentModule.routes.lessons}/${lessons.indexOf(nextGroup.lessons[0]) + 1}`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next Group: {nextGroup.title}
                  <span className="ml-2">→</span>
                </Link>
              ) : (
                <Link
                  href={currentModule.slug === 'programming-fundamentals' ? '/programming/quiz' : currentModule.routes.quiz}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Take Assessment
                  <span className="ml-2">🎯</span>
                </Link>
              )
            ) : (
              <Link
                href={currentModule.slug === 'programming-fundamentals' ? `/programming/lessons/${lessonIndex + 2}` : `${currentModule.routes.lessons}/${lessonIndex + 2}`} // Next lesson
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next Lesson
                <span className="ml-2">→</span>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}