import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { contentRegistry } from '@/lib/contentRegistry';
import QuizLayout from '@/components/QuizLayout';

// For server components in Next.js 15, params are still Promises that need to be awaited
interface QuizPageProps {
  params: Promise<{ moduleSlug: string }>;
}

export async function generateStaticParams() {
  const modules = await contentRegistry.getModules();
  return modules
    .filter(mod => mod.status === 'active')
    .map((mod) => ({
      moduleSlug: mod.slug,
    }));
}

export async function generateMetadata({ params }: QuizPageProps): Promise<Metadata> {
  const { moduleSlug } = await params;
  const mod = await contentRegistry.getModule(moduleSlug);
  
  if (!mod) {
    return {
      title: 'Quiz Not Found',
    };
  }

  return {
    title: `${mod.title} Quiz - Fullstack Learning Platform`,
    description: `Test your knowledge of ${mod.title} with comprehensive questions and scenarios.`,
    keywords: mod.technologies.join(', '),
  };
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { moduleSlug } = await params;
  const currentModule = await contentRegistry.getModule(moduleSlug);
  
  if (!currentModule) {
    notFound();
  }
 
  const quiz = await contentRegistry.getModuleQuiz(currentModule.slug);
  const thresholds = await contentRegistry.checkModuleThresholds(currentModule.slug);

  if (!thresholds.quizValid && process.env.NODE_ENV === 'production') {
    notFound();
  }

  // Get passing score from module metadata or default to 70
  const passingScore = currentModule.metadata?.thresholds?.passingScore || 70;
  const layoutThresholds = {
    requiredQuestions: currentModule.thresholds?.requiredQuestions,
    passingScore,
  };
  const allModules = await contentRegistry.getModules();
  const unlockingModules = allModules
    .filter(m => (m.prerequisites || []).includes(currentModule.slug))
    .map(m => ({ slug: m.slug, title: m.title, routes: { overview: m.routes.overview } }));

  return (
    <QuizLayout module={currentModule} quiz={quiz} thresholds={layoutThresholds} unlockingModules={unlockingModules}>
      {/* Quiz Content */}
      {quiz && quiz.questions && quiz.questions.length > 0 ? (
        <div className="space-y-6">
          <div className="glass-morphism p-8 rounded-xl">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              🎯 Assessment Overview
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              This quiz contains {quiz.questions.length} questions covering all the key concepts from the {currentModule.title} module. 
              You&apos;ll be tested on various topics including terminology, concepts, and practical applications.
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
              {(() => {
                const percent = Math.min(100, Math.round((quiz.questions.length / Math.max(1, (layoutThresholds.requiredQuestions ?? quiz.questions.length))) * 100));
                const isPerfect = percent === 100;
                return (
                  <div className={`p-4 rounded-lg ${isPerfect ? 'badge-perfect' : 'bg-green-50 dark:bg-green-900/30'}`}>
                    <div className={`text-2xl font-bold ${isPerfect ? 'text-white' : 'text-green-600 dark:text-green-300'}`}>
                      {percent}%
                    </div>
                    <div className={`text-sm ${isPerfect ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'}`}>
                      Requirement Met
                    </div>
                  </div>
                );
              })()}
              <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                  {passingScore}%
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

            <div className="flex justify-end">
              <Link
                href={`${currentModule.routes.quiz}/start`}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-medium"
              >
                Start Quiz
                <span className="ml-2">🎯</span>
              </Link>
            </div>

            {unlockingModules && unlockingModules.length > 0 && (
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Unlocks on completion</h3>
                <div className="flex flex-wrap gap-2">
                  {unlockingModules.map((m) => (
                    <Link key={m.slug} href={m.routes.overview} className="unlock-chip">
                      <span className="mr-1">🔓</span>
                      {m.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
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
            href={currentModule.routes.overview}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Module
          </Link>
        </div>
      )}

      {/* Navigation Footer */}
      <footer className="mt-12 flex justify-between items-center">
        <Link
          href={currentModule.routes.overview}
          className="inline-flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Back to Module Overview
        </Link>
        
        {thresholds.lessonsValid && (
          <Link
            href={currentModule.routes.lessons}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Review Lessons
            <span className="ml-2">📚</span>
          </Link>
        )}
      </footer>
    </QuizLayout>
  );
}