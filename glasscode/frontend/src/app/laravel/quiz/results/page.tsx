import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('laravel');
  if (!currentModule) {
    return { title: 'Quiz Not Found' };
  }
  return {
    title: `${currentModule.title} Quiz Results - Fullstack Learning Platform`,
    description: `View your ${currentModule.title} quiz results and performance on ${currentModule.technologies.join(', ')}.`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function LaravelQuizResultsPage() {
  const mod = await contentRegistry.findModuleByRoutePath('/laravel/quiz/results');
  const target = mod ? `/modules/${mod.slug}/quiz/results` : '/';
  redirect(target);
}