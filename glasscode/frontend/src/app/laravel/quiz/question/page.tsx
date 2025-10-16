import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('laravel');
  if (!currentModule) {
    return { title: 'Quiz Not Found' };
  }
  return {
    title: `${currentModule.title} Quiz Question - Fullstack Learning Platform`,
    description: `Answer ${currentModule.title} quiz questions to test your knowledge of ${currentModule.technologies.join(', ')}.`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function LaravelQuizQuestionPage() {
  const mod = await contentRegistry.findModuleByRoutePath('/laravel/quiz/question');
  const target = mod ? `/modules/${mod.slug}/quiz/question` : '/';
  redirect(target);
}