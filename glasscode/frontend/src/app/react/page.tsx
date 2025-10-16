import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import RetryButton from '@/components/RetryButton';
import { contentRegistry } from '@/lib/contentRegistry';
import type { Module, Lesson, Quiz } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('react-fundamentals');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `${currentModule.title} - Fullstack Learning Platform`,
    description: currentModule.description,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function ReactModulePage() {
  let currentModule: Module | null = null;
  let tier = null;
  let thresholds = { lessons: false, lessonsValid: false, quiz: false, quizValid: false, overall: false };
  let lessons: Lesson[] = [];
  let quiz: Quiz | null = null;

  try {
    currentModule = await contentRegistry.getModule('react-fundamentals');
    if (!currentModule) {
      notFound();
    }
    tier = await contentRegistry.getTier(currentModule.tier);
    thresholds = await contentRegistry.checkModuleThresholds(currentModule.slug);
    lessons = await contentRegistry.getModuleLessons(currentModule.slug);
    quiz = await contentRegistry.getModuleQuiz(currentModule.slug);
  } catch (error) {
    console.error('Error loading module data:', error);
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="glass-morphism p-8 rounded-xl text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Content Unavailable</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We&apos;re having trouble loading the content for this module. This might be due to a temporary issue with our content registry.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <RetryButton />
            <Link href="/" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-center">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!currentModule) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="glass-morphism p-8 rounded-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {currentModule.title}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            {currentModule.description}
          </p>
          
          {/* Tier Badge */}
          {tier && (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {tier.title} Tier
            </div>
          )}
        </div>

        {/* Technologies */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Technologies Covered</h2>
          <div className="flex flex-wrap gap-2">
            {currentModule.technologies.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Prerequisites */}
        {currentModule.prerequisites && currentModule.prerequisites.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Prerequisites</h2>
            <div className="space-y-2">
              {currentModule.prerequisites.map((prereq) => (
                <PrerequisiteLink key={prereq} slug={prereq} />
              ))}
            </div>
          </div>
        )}

        {/* Learning Path */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Lessons Section */}
          <div className="glass-morphism p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">📚</span>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Lessons</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Available Lessons:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{lessons.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Status:</span>
                <span className={`font-semibold ${thresholds.lessons ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                  {thresholds.lessons ? 'Ready' : 'In Development'}
                </span>
              </div>
              {thresholds.lessons && (
                <div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">Learn the core concepts through structured lessons and practical examples.</p>
                  <Link href="/react/lessons" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Start Learning<span className="ml-2">→</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quiz Section */}
          <div className="glass-morphism p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">🎯</span>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Quiz</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Questions Available:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{quiz?.questions?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Status:</span>
                <span className={`font-semibold ${thresholds.quiz ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                  {thresholds.quiz ? 'Available' : 'Coming Soon'}
                </span>
              </div>
              {thresholds.quiz && (
                <div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">Test your knowledge with comprehensive questions and scenarios.</p>
                  <Link href="/react/quiz" className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Take Quiz<span className="ml-2">🎯</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Module Status */}
        <div className="text-center">
          <div className={`inline-flex items-center px-4 py-2 rounded-lg ${
            thresholds.overall 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          }`}>
            <span className="mr-2">{thresholds.overall ? '✅' : '⚠️'}</span>
            {thresholds.overall ? 'Module Complete & Ready' : 'Module In Development'}
          </div>
        </div>
      </div>
    </div>
  );
}

async function PrerequisiteLink({ slug }: { slug: string }) {
  try {
    const prereqModule = await contentRegistry.getModule(slug);
    if (!prereqModule) return null;
    
    return (
      <Link 
        href={`/react`} 
        className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
      >
        <span className="mr-2">📋</span>
        {prereqModule.title}
      </Link>
    );
  } catch (error) {
    console.error(`Error loading prerequisite module ${slug}:`, error);
    return null;
  }
}