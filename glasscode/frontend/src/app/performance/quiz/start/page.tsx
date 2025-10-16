import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('performance');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `Start ${currentModule.title} Quiz - Fullstack Learning Platform`,
    description: `Begin your ${currentModule.title} quiz. Test your knowledge of ${currentModule.technologies.join(', ')}.`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function PerformanceQuizStartPage() {
  const mod = await contentRegistry.findModuleByRoutePath('/performance/quiz/start');
  const target = mod ? `/modules/${mod.slug}/quiz/start` : '/';
  redirect(target);
}