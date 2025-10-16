import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('sass');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `Start ${currentModule.title} Quiz - Fullstack Learning Platform`,
    description: `Begin your ${currentModule.title} assessment. ${currentModule.description}`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function SassQuizStartPage() {
  const mod = await contentRegistry.findModuleByRoutePath('/sass/quiz/start');
  const target = mod ? `/modules/${mod.slug}/quiz/start` : '/';
  redirect(target);
}