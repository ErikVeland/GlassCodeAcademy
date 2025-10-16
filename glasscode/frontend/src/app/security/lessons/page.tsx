import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('security');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `${currentModule.title} Lessons - Fullstack Learning Platform`,
    description: `Learn ${currentModule.title} through interactive lessons. ${currentModule.description}`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function SecurityLessonsPage() {
  const mod = await contentRegistry.findModuleByRoutePath('/security/lessons');
  const target = mod ? `/modules/${mod.slug}/lessons` : '/';
  redirect(target);
}