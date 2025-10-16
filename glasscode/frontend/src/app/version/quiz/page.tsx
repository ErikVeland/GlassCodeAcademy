import { notFound, redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.findModuleByRoutePath('/version/lessons');
  
  if (!currentModule) {
    return { title: 'Quiz Not Found' };
  }

  return {
    title: `${currentModule.title} Quiz - Test Your Knowledge`,
    description: `Test your understanding of ${currentModule.title} concepts with our comprehensive quiz.`,
    keywords: currentModule.technologies.join(', '),
  };
}

export const revalidate = 3600; // Revalidate every hour

export default async function VersionQuizPage() {
  // Find the version-control module
  const currentModule = await contentRegistry.findModuleByRoutePath('/version/lessons');
  
  if (!currentModule) {
    notFound();
  }

  const quiz = await contentRegistry.getModuleQuiz(currentModule.slug);
  
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    notFound();
  }

  // Check if module meets threshold requirements for quiz access
  const lessons = await contentRegistry.getModuleLessons(currentModule.slug);
  const hasMinimumLessons = lessons && lessons.length >= (currentModule.thresholds?.requiredLessons || 1);
  const hasMinimumQuestions = quiz.questions.length >= (currentModule.thresholds?.requiredQuestions || 1);
  
  if (!hasMinimumLessons || !hasMinimumQuestions) {
    // Redirect to module overview if thresholds not met
    redirect(`/version`);
  }

  // Redirect to the quiz start page
  redirect(`/version/quiz/start`);
}