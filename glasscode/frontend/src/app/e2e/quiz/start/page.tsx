import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('e2e');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `Start ${currentModule.title} Quiz - Fullstack Learning Platform`,
    description: `Begin your ${currentModule.title} assessment. ${currentModule.description}`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function E2EQuizStartPage() {
  const mod = await contentRegistry.findModuleByRoutePath('/e2e/quiz/start');
  const target = mod ? `/modules/${mod.slug}/quiz/start` : '/';
  redirect(target);
}