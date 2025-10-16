import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('e2e');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `${currentModule.title} Quiz Results - Fullstack Learning Platform`,
    description: `View your ${currentModule.title} quiz results and performance. ${currentModule.description}`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function E2EQuizResultsPage() {
  const mod = await contentRegistry.findModuleByRoutePath('/e2e/quiz/results');
  const target = mod ? `/modules/${mod.slug}/quiz/results` : '/';
  redirect(target);
}