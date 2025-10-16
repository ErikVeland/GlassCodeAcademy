import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('graphql');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `${currentModule.title} Quiz - Fullstack Learning Platform`,
    description: `Test your knowledge of ${currentModule.title} with our comprehensive quiz covering ${currentModule.technologies.join(', ')}.`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function GraphqlQuizPage() {
  const currentModule = await contentRegistry.getModule('graphql');
  
  if (!currentModule) {
    redirect('/');
    return;
  }

  const lessons = await contentRegistry.getModuleLessons(currentModule.slug);
  const quiz = await contentRegistry.getModuleQuiz(currentModule.slug);

  // Check if module has minimum required lessons (at least 3)
  if (!lessons || lessons.length < 3) {
    redirect(`/graphql`);
    return;
  }

  // Check if quiz has minimum required questions (at least 5)
  if (!quiz || !quiz.questions || quiz.questions.length < 5) {
    redirect(`/graphql`);
    return;
  }

  // Redirect to quiz start page
  redirect('/graphql/quiz/start');
}