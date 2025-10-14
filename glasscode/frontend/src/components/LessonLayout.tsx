import Link from 'next/link';
import type { Module, Lesson } from '@/lib/contentRegistry';

interface LessonLayoutProps {
  module: Module;
  lesson: Lesson;
  lessons: Lesson[];
  lessonIndex: number;
  groupTitle?: string;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

export default function LessonLayout({ module, lesson, lessons, lessonIndex, groupTitle }: LessonLayoutProps) {
  return (
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
            {groupTitle} - Lesson {lessonIndex + 1}
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
                  {module.title} • {groupTitle} • Lesson {lesson.order || lessonIndex + 1} of {lessons.length}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">🕒 {lesson.estimatedMinutes || 30} minutes</span>
            </div>
          </div>

          {/* Learning Objectives */}
          {lesson.objectives && lesson.objectives.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">🎯 Learning Objectives</h2>
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
        {lesson.intro && (
          <section className="glass-morphism p-8 rounded-xl">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Introduction</h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {lesson.intro.split('\n\n').map((paragraph: string, index: number) => (
                <p key={index} className="text-gray-700 dark:text-gray-300 mb-4">{paragraph}</p>
              ))}
            </div>
          </section>
        )}

        {lesson.code && lesson.code.example && (
          <section className="glass-morphism p-8 rounded-xl">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">💻 Code Example</h2>
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

        {lesson.pitfalls && lesson.pitfalls.length > 0 && (
          <section className="glass-morphism p-8 rounded-xl">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">⚠️ Common Pitfalls</h2>
            <div className="space-y-4">
                {lesson.pitfalls.map((pitfall, index) => (
                <div key={index} className="border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 text-xl mt-1">⚠️</span>
                    <div>
                      <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">{pitfall.mistake || `Pitfall ${index + 1}`}</h3>
                      <p className="text-yellow-700 dark:text-yellow-300 mb-2"><strong>Solution:</strong> {pitfall.solution || 'Review best practices and documentation.'}</p>
                      {pitfall.severity && (
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          pitfall.severity === 'high'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : pitfall.severity === 'medium'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
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

        {lesson.exercises && lesson.exercises.length > 0 && (
          <section className="glass-morphism p-8 rounded-xl">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">📝 Practice Exercises</h2>
            <div className="space-y-6">
              {lesson.exercises.map((exercise, index) => (
                <div key={index} className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">{exercise.title || `Exercise ${index + 1}`}</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{exercise.description || 'Practice the concepts learned above.'}</p>
                  {exercise.checkpoints && exercise.checkpoints.length > 0 && (
                    <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                      {exercise.checkpoints.map((cp: string, i: number) => (
                        <li key={i}>{cp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}