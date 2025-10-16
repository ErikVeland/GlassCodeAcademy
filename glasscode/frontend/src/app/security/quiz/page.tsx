import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('security');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `${currentModule.title} Quiz - Fullstack Learning Platform`,
    description: `Test your knowledge of ${currentModule.title}. ${currentModule.description}`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function SecurityQuizPage() {
  const currentModule = await contentRegistry.getModule('security');
  if (!currentModule) {
    redirect('/');
    return;
  }

  // Check if module has minimum required lessons and questions
  const lessons = await contentRegistry.getModuleLessons(currentModule.slug);
  const quizData = await contentRegistry.getModuleQuiz(currentModule.slug);
  
  if (lessons.length < 3 || !quizData || quizData.questions.length < 5) {
    redirect(`/${currentModule.slug}`);
    return;
  }

  redirect(`/${currentModule.slug}/quiz/start`);
}