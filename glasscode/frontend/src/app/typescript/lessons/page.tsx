import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('typescript');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `${currentModule.title} Lessons - Fullstack Learning Platform`,
    description: `Learn ${currentModule.title} through comprehensive lessons and practical examples. ${currentModule.description}`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function TypescriptLessonsPage() {
  const mod = await contentRegistry.findModuleByRoutePath('/typescript/lessons');
  const target = mod ? `/modules/${mod.slug}/lessons` : '/';
  redirect(target);
}