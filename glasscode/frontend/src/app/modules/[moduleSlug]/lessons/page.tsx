import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { contentRegistry, getLessonGroups } from '@/lib/contentRegistry';

interface LessonsPageProps {
  params: Promise<{ moduleSlug: string }>;
}

export async function generateStaticParams() {
  const modules = await contentRegistry.getModules();
  return modules
    .filter(module => module.status === 'active')
    .map((module) => ({
      moduleSlug: module.slug,
    }));
}

export async function generateMetadata({ params }: LessonsPageProps): Promise<Metadata> {
  const { moduleSlug } = await params;
  const module = await contentRegistry.getModule(moduleSlug);
  
  if (!module) {
    return {
      title: 'Lessons Not Found',
    };
  }

  return {
    title: `${module.title} Lessons - Fullstack Learning Platform`,
    description: `Learn ${module.title} through structured lessons and practical examples.`,
    keywords: module.technologies.join(', '),
  };
}

export default async function LessonsPage({ params }: LessonsPageProps) {
  const { moduleSlug } = await params;
  const module = await contentRegistry.getModule(moduleSlug);
  
  if (!module) {
    notFound();
  }

  const lessons = await contentRegistry.getModuleLessons(module.slug);
  const thresholds = await contentRegistry.checkModuleThresholds(module.slug);
  const lessonGroups = getLessonGroups(module.slug, lessons);

  if (!thresholds.lessonsValid && process.env.NODE_ENV === 'production') {
    notFound();
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
              <Link href={module.routes.overview} className="text-blue-600 hover:text-blue-800">
                {module.title}
              </Link>
            </li>
            <li className="text-gray-500">/</li>
            <li className="text-gray-900 dark:text-gray-100 font-medium">
              Lessons
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <div className="glass-morphism p-8 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl" role="img" aria-label={`${module.title} icon`}>
                {module.icon}
              </span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {module.title} Lessons
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {lessonGroups.length} lesson groups available
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Lesson Groups List */}
        {lessonGroups && lessonGroups.length > 0 ? (
          <div className="space-y-6">
            {lessonGroups.map((group, groupIndex) => (
              <div key={group.id} className="glass-morphism p-6 rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-bold">
                        {group.order}
                      </span>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {group.title}
                      </h2>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded text-sm">
                        {group.lessons.length} lessons
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {group.description}
                    </p>

                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Lessons in this group:
                      </h3>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {group.lessons.map((lesson: any, lessonIndex: number) => (
                          <li key={lesson.id} className="flex items-center gap-2">
                            <span className="text-blue-500">•</span>
                            {lesson.title}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {group.lessons[0] && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {group.lessons[0].tags?.slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-6">
                    {group.lessons[0] && (
                      <Link
                        href={`${module.routes.lessons}/${group.lessons[0].order}`}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Start Group
                        <span className="ml-2">→</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-morphism p-12 rounded-xl text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              No Lessons Available Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Lessons for this module are currently being prepared. Check back soon!
            </p>
            <Link
              href={module.routes.overview}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Back to Module
            </Link>
          </div>
        )}

        {/* Navigation Footer */}
        <footer className="mt-12 flex justify-between items-center">
          <Link
            href={module.routes.overview}
            className="inline-flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Back to Module Overview
          </Link>
          
          {thresholds.quizValid && (
            <Link
              href={module.routes.quiz}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Take Assessment
              <span className="ml-2">🎯</span>
            </Link>
          )}
        </footer>
      </div>
    </>
  );
}