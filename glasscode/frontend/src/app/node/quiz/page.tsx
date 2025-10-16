import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('node');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `${currentModule.title} Quiz - Fullstack Learning Platform`,
    description: `Test your knowledge of ${currentModule.title} with our comprehensive quiz. ${currentModule.description}`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function NodeQuizPage() {
  const currentModule = await contentRegistry.getModule('node');
  
  if (!currentModule) {
    redirect('/');
    return;
  }

  // Check if module has minimum required lessons and quiz questions
  const lessons = await contentRegistry.getModuleLessons(currentModule.slug);
  const quiz = await contentRegistry.getModuleQuiz(currentModule.slug);

  if (!lessons || lessons.length < 3) {
    redirect('/node');
    return;
  }

  if (!quiz || !quiz.questions || quiz.questions.length < 5) {
    redirect('/node');
    return;
  }

  // Redirect to quiz start page
  redirect('/node/quiz/start');
}