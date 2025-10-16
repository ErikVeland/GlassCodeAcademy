import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('e2e');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `${currentModule.title} Quiz - Fullstack Learning Platform`,
    description: `Test your ${currentModule.title} knowledge with our interactive quiz. ${currentModule.description}`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function E2EQuizPage() {
  const currentModule = await contentRegistry.getModule('e2e');
  if (!currentModule) {
    redirect('/');
    return;
  }

  const lessons = await contentRegistry.getModuleLessons(currentModule.slug);
  const quiz = await contentRegistry.getModuleQuiz(currentModule.slug);

  // Check if module has minimum required content
  const hasMinimumLessons = lessons.length >= 3;
  const hasMinimumQuestions = quiz && quiz.questions && quiz.questions.length >= 5;

  if (!hasMinimumLessons || !hasMinimumQuestions) {
    redirect(`/${currentModule.slug}`);
    return;
  }

  redirect(`/${currentModule.slug}/quiz/start`);
}