import { notFound } from 'next/navigation';
import Link from 'next/link';
import { contentRegistry } from '@/lib/contentRegistry';
import { Metadata } from 'next';

interface LessonPageProps {
  params: Promise<{ 
    moduleSlug: string;
    lessonOrder: string;
  }>;
}

export async function generateStaticParams() {
  const modules = await contentRegistry.getModules();
  const params: Array<{ moduleSlug: string; lessonOrder: string }> = [];
  
  for (const module of modules) {
    if (module.status === 'active') {
      const lessons = await contentRegistry.getModuleLessons(module.slug);
      if (lessons) {
        lessons.forEach((_, index) => {
          params.push({
            moduleSlug: module.slug,
            lessonOrder: (index + 1).toString(),
          });
        });
      }
    }
  }
  
  return params;
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { moduleSlug, lessonOrder } = await params;
  const module = await contentRegistry.getModule(moduleSlug);
  const lessons = await contentRegistry.getModuleLessons(moduleSlug);
  const lessonIndex = parseInt(lessonOrder) - 1;
  const lesson = lessons?.[lessonIndex];
  
  if (!module || !lesson) {
    return {
      title: 'Lesson Not Found',
    };
  }

  return {
    title: `${lesson.title} - ${module.title} Lessons`,
    description: lesson.intro?.substring(0, 160) || `Learn ${lesson.title} in the ${module.title} module.`,
    keywords: lesson.tags?.join(', ') || module.technologies.join(', '),
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { moduleSlug, lessonOrder } = await params;
  const module = await contentRegistry.getModule(moduleSlug);
  
  if (!module) {
    notFound();
  }

  const lessons = await contentRegistry.getModuleLessons(module.slug);
  const lessonIndex = parseInt(lessonOrder) - 1;
  const lesson = lessons?.[lessonIndex];

  if (!lesson || !lessons) {
    notFound();
  }

  const prevLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;

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
              <Link href={module.routes.overview} className="text-blue-600 hover:text-blue-800">
                {module.title}
              </Link>
            </li>
            <li className="text-gray-500">/</li>
            <li>
              <Link href={module.routes.lessons} className="text-blue-600 hover:text-blue-800">
                Lessons
              </Link>
            </li>
            <li className="text-gray-500">/</li>
            <li className="text-gray-900 dark:text-gray-100 font-medium">
              Lesson {lessonOrder}
            </li>
          </ol>
        </nav>

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
                    {module.title} • Lesson {lesson.order || lessonIndex + 1} of {lessons.length}
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
                      <span className="text-green-500">✓</span>
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
                {lesson.pitfalls.map((pitfall: any, index: number) => (
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
                {lesson.exercises.map((exercise: any, index: number) => (
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
            {prevLesson ? (
              <Link
                href={`${module.routes.lessons}/${prevLesson.order || lessonIndex}`}
                className="inline-flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← Previous: {prevLesson.title}
              </Link>
            ) : (
              <Link
                href={module.routes.lessons}
                className="inline-flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← Back to Lessons
              </Link>
            )}
          </div>
          
          <div>
            {nextLesson ? (
              <Link
                href={`${module.routes.lessons}/${nextLesson.order || lessonIndex + 2}`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next: {nextLesson.title}
                <span className="ml-2">→</span>
              </Link>
            ) : (
              <Link
                href={module.routes.quiz}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Take Assessment
                <span className="ml-2">🎯</span>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}