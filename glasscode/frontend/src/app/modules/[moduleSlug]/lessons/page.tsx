export const revalidate = 3600
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';
import { contentRegistry, getLessonGroups } from '@/lib/contentRegistry';
import { getModuleTheme } from '@/lib/moduleThemes';

interface LessonsPageProps {
  params: Promise<{ moduleSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateStaticParams() {
  // Align gating with SSG strategy: require ENABLE_BUILD_SSG and non-DB content mode
  if (process.env.ENABLE_BUILD_SSG !== 'true') {
    return [];
  }
  if ((process.env.GC_CONTENT_MODE || '').toLowerCase() === 'db') {
    return [];
  }
  const modules = await contentRegistry.getModules();
  return modules
    .filter((m) => m.status === 'active')
    .map((m) => ({
      moduleSlug: m.slug,
    }));
}

export async function generateMetadata({ params }: LessonsPageProps): Promise<Metadata> {
  const { moduleSlug } = await params;
  const currentModule = await contentRegistry.getModule(moduleSlug);
  
  if (!currentModule) {
    return {
      title: 'Lessons Not Found',
    };
  }

  return {
    title: `${currentModule.title} Lessons - Fullstack Learning Platform`,
    description: `Learn ${currentModule.title} through structured lessons and practical examples.`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function LessonsPage({ params, searchParams }: LessonsPageProps) {
  const { moduleSlug } = await params;
  const sp = (searchParams ? await searchParams : {}) || {};
  const selectedTopic = typeof sp.topic === 'string' ? sp.topic : Array.isArray(sp.topic) ? sp.topic[0] : undefined;
  const currentModule = await contentRegistry.getModule(moduleSlug);
  
  if (!currentModule) {
    notFound();
  }

  const theme = getModuleTheme(currentModule.slug);
  const lessons = await contentRegistry.getModuleLessons(currentModule.slug);
  const thresholds = await contentRegistry.checkModuleThresholds(currentModule.slug);
  let lessonGroups = getLessonGroups(currentModule.slug, lessons);

  // If a topic is selected via query param, filter groups and lessons accordingly
  if (selectedTopic) {
    lessonGroups = lessonGroups
      .map((group) => ({
        ...group,
        lessons: group.lessons.filter((l) => l.topic === selectedTopic)
      }))
      .filter((group) => group.lessons.length > 0);
  }

  if (!thresholds.lessonsValid && process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation />

        {/* Header */}
        <header className="mb-12">
          <div className="glass-morphism p-8 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl" role="img" aria-label={`${currentModule.title} icon`}>
                {currentModule.icon}
              </span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {currentModule.title} Lessons
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {lessonGroups.length} lesson group{lessonGroups.length !== 1 ? 's' : ''} available
                </p>
                {selectedTopic && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                      Topic: {selectedTopic}
                    </span>
                    <Link
                      href={currentModule.routes.lessons}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Clear filter
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Lesson Groups List */}
        {lessonGroups && lessonGroups.length > 0 ? (
          <div className="space-y-6">
            {lessonGroups.map((group) => (
              <div key={group.id} className="glass-morphism p-6 rounded-xl">
                <div className="flex flex-col sm:flex-row items-start justify-between">
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

                    <div className="md:flex md:items-end md:justify-between">
                      <div className="md:flex-1 md:pr-6 mb-4 md:mb-0">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Lessons in this group:
                        </h3>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {group.lessons.map((lesson) => (
                            <li key={lesson.id} className="flex items-center gap-2">
                              <span className="text-blue-500">•</span>
                              {lesson.title}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {group.lessons[0] && (
                        <div className="mt-4 md:mt-0 md:ml-6 w-full sm:w-auto">
                          <Link
                            href={currentModule.slug === 'programming-fundamentals' ? `/programming/lessons/${lessons.indexOf(group.lessons[0]) + 1}` : `${currentModule.routes.lessons}/${lessons.indexOf(group.lessons[0]) + 1}`}
                            className={`inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-lg transition-colors ${theme.button}`}
                          >
                            Start Group
                            <span className="ml-2">→</span>
                          </Link>
                        </div>
                      )}
                    </div>

                    {group.lessons[0] && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {/* Show the topic for visibility when filtering */}
                        {group.lessons[0].topic && (
                          <Link
                            href={`${currentModule.routes.lessons}?topic=${encodeURIComponent(group.lessons[0].topic)}`}
                            className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50"
                          >
                            {group.lessons[0].topic}
                          </Link>
                        )}
                      </div>
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
              href={currentModule.routes.overview}
              className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${theme.button}`}
            >
              ← Back to Module
            </Link>
          </div>
        )}

        {/* Navigation Footer */}
        <footer className="mt-12 flex justify-between items-center">
            <Link
              href={currentModule.routes.overview}
              className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${theme.link}`}
            >
              ← Back to Module Overview
            </Link>
            
          {thresholds.quizValid && (
            <Link
              href={currentModule.routes.quiz}
              className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${theme.button}`}
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