import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('react-fundamentals');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `${currentModule.title} Quiz Results - Fullstack Learning Platform`,
    description: `View your ${currentModule.title} quiz results and performance analysis. ${currentModule.description}`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function ReactQuizResultsPage() {
  const currentModule = await contentRegistry.findModuleByRoutePath('/react/quiz/results');
  const target = currentModule ? `/modules/${currentModule.slug}/quiz/results` : '/';
  redirect(target);
}