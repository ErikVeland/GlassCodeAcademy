import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import RetryButton from '@/components/RetryButton';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('laravel');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `${currentModule.title} - Fullstack Learning Platform`,
    description: currentModule.description,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function LaravelPage() {
  const currentModule = await contentRegistry.getModule('laravel');
  
  if (!currentModule) {
    notFound();
  }

  const tier = currentModule.tier ? await contentRegistry.getTier(currentModule.tier) : null;
  const lessons = await contentRegistry.getModuleLessons(currentModule.slug);
  const quiz = await contentRegistry.getModuleQuiz(currentModule.slug);

  if (!tier) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Content Unavailable</h1>
          <p className="text-gray-600 mb-4">
            The {currentModule.title} module content is currently unavailable.
          </p>
          <RetryButton />
        </div>
      </div>
    );
  }

  const completedLessons = 0; // This would come from user progress
  const totalLessons = lessons?.length || 0;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{currentModule.title}</h1>
          <p className="text-xl text-gray-600 mb-6">{currentModule.description}</p>
          
          {/* Module Status */}
          <div className="flex items-center gap-4 mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentModule.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {currentModule.status === 'active' ? 'Active' : 'Coming Soon'}
            </span>
            <span className="text-sm text-gray-500">
              {totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Progress Bar */}
          {totalLessons > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{completedLessons}/{totalLessons} lessons completed</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Technologies */}
        {currentModule.technologies && currentModule.technologies.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Technologies Covered</h2>
            <div className="flex flex-wrap gap-2">
              {currentModule.technologies.map((tech) => (
                <span 
                  key={tech}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Prerequisites */}
        {currentModule.prerequisites && currentModule.prerequisites.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Prerequisites</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {currentModule.prerequisites.map((prereq, index) => (
                <li key={index}>{prereq}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Learning Objectives */}
        {tier.learningObjectives && tier.learningObjectives.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Learning Objectives</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {tier.learningObjectives.map((objective, index) => (
                <li key={index}>{objective}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {currentModule.status === 'active' && totalLessons > 0 && (
            <Link
              href="/laravel/lessons"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              {completedLessons > 0 ? 'Continue Learning' : 'Start Learning'}
            </Link>
          )}
          
          {quiz && quiz.questions && quiz.questions.length >= 5 && (
            <Link
              href="/laravel/quiz"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Take Quiz
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}