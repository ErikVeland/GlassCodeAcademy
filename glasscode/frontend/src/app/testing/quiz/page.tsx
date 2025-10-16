import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('testing');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `${currentModule.title} Quiz - Fullstack Learning Platform`,
    description: `Test your knowledge of ${currentModule.title}. ${currentModule.description}`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function TestingQuizPage() {
  const currentModule = await contentRegistry.getModule('testing');
  
  if (!currentModule) {
    redirect('/');
    return;
  }

  const lessons = await contentRegistry.getModuleLessons(currentModule.slug);
  const quiz = await contentRegistry.getModuleQuiz(currentModule.slug);

  // Check if minimum requirements are met
  const hasMinimumLessons = lessons && lessons.length >= 3;
  const hasMinimumQuestions = quiz && quiz.questions && quiz.questions.length >= 5;

  if (!hasMinimumLessons || !hasMinimumQuestions) {
    // Redirect to module overview if requirements not met
    redirect('/testing');
    return;
  }

  // Redirect to quiz start page
  redirect('/testing/quiz/start');
}