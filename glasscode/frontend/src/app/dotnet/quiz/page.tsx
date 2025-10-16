import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.findModuleByRoutePath('/dotnet');
  
  if (!currentModule) {
    return { title: 'Quiz Not Found' };
  }

  return {
    title: `${currentModule.title} Quiz`,
    description: `Test your knowledge of ${currentModule.title} with comprehensive questions and scenarios.`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function DotnetQuizPage() {
  const currentModule = await contentRegistry.findModuleByRoutePath('/dotnet');
  
  if (!currentModule) {
    redirect('/404');
  }

  const quiz = await contentRegistry.getModuleQuiz(currentModule.slug);
  
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    redirect('/404');
  }

  // Check if module meets threshold requirements for quiz access
  const lessons = await contentRegistry.getModuleLessons(currentModule.slug);
  const hasMinimumLessons = lessons && lessons.length >= (currentModule.thresholds?.requiredLessons || 1);
  const hasMinimumQuestions = quiz.questions.length >= (currentModule.thresholds?.requiredQuestions || 1);
  
  if (!hasMinimumLessons || !hasMinimumQuestions) {
    // Redirect to module overview if thresholds not met
    redirect(`/dotnet`);
  }

  // Redirect to the quiz start page
  redirect(`/dotnet/quiz/start`);
}