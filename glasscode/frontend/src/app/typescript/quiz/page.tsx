import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('typescript');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `${currentModule.title} Quiz - Fullstack Learning Platform`,
    description: `Test your knowledge of ${currentModule.title} with our comprehensive quiz. ${currentModule.description}`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function TypescriptQuizPage() {
  const currentModule = await contentRegistry.getModule('typescript');
  
  if (!currentModule) {
    redirect('/');
    return;
  }

  // Check if module has minimum required lessons and quiz questions
  const lessons = await contentRegistry.getModuleLessons(currentModule.slug);
  const quiz = await contentRegistry.getModuleQuiz(currentModule.slug);

  if (!lessons || lessons.length < 3) {
    redirect('/typescript');
    return;
  }

  if (!quiz || !quiz.questions || quiz.questions.length < 5) {
    redirect('/typescript');
    return;
  }

  // Redirect to quiz start page
  redirect('/typescript/quiz/start');
}