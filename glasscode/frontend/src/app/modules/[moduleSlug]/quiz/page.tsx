import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { contentRegistry } from '@/lib/contentRegistry';

interface QuizPageProps {
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

export async function generateMetadata({ params }: QuizPageProps): Promise<Metadata> {
  const { moduleSlug } = await params;
  const module = await contentRegistry.getModule(moduleSlug);
  
  if (!module) {
    return {
      title: 'Quiz Not Found',
    };
  }

  return {
    title: `${module.title} Quiz - Fullstack Learning Platform`,
    description: `Test your knowledge of ${module.title} with comprehensive questions and scenarios.`,
    keywords: module.technologies.join(', '),
  };
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { moduleSlug } = await params;
  const module = await contentRegistry.getModule(moduleSlug);
  
  if (!module) {
    notFound();
  }

  const quiz = await contentRegistry.getModuleQuiz(module.slug);
  const thresholds = await contentRegistry.checkModuleThresholds(module.slug);

  if (!thresholds.quizValid && process.env.NODE_ENV === 'production') {
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
              Quiz
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
                  {module.title} Quiz
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Test your knowledge with {quiz?.questions?.length || 0} comprehensive questions
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Quiz Content */}
        {quiz && quiz.questions && quiz.questions.length > 0 ? (
          <div className="space-y-6">
            <div className="glass-morphism p-8 rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                🎯 Assessment Overview
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This quiz contains {quiz.questions.length} questions covering all the key concepts from the {module.title} module. 
                You'll be tested on various topics including terminology, concepts, and practical applications.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                    {quiz.questions.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Total Questions
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-300">
                    {Math.round((quiz.questions.length / module.thresholds.requiredQuestions) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Requirement Met
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                    {module.metadata.thresholds.passingScore}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Passing Score
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm">
                  Multiple Choice
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm">
                  True/False
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-sm">
                  Scenario-Based
                </span>
              </div>

              <Link
                href={`${module.routes.quiz}/start`}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-medium"
              >
                Start Quiz
                <span className="ml-2">🎯</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="glass-morphism p-12 rounded-xl text-center">
            <div className="text-6xl mb-4">❓</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Quiz Questions Not Available Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Quiz questions for this module are currently being prepared. Check back soon!
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
          
          {thresholds.lessonsValid && (
            <Link
              href={module.routes.lessons}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Review Lessons
              <span className="ml-2">📚</span>
            </Link>
          )}
        </footer>
      </div>
    </>
  );
}