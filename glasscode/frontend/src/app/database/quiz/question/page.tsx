import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('database-systems');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `${currentModule.title} Quiz Question - Fullstack Learning Platform`,
    description: `Answer ${currentModule.title} quiz questions to test your understanding. ${currentModule.description}`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function DatabaseQuizQuestionPage() {
  const currentModule = await contentRegistry.findModuleByRoutePath('/database/quiz/question');
  const target = currentModule ? `/modules/${currentModule.slug}/quiz/question` : '/';
  redirect(target);
}