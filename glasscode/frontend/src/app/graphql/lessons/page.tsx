import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('graphql');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `${currentModule.title} Lessons - Fullstack Learning Platform`,
    description: `Learn ${currentModule.title} with our comprehensive lessons covering ${currentModule.technologies.join(', ')}.`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function GraphqlLessonsPage() {
  const mod = await contentRegistry.findModuleByRoutePath('/graphql/lessons');
  const target = mod ? `/modules/${mod.slug}/lessons` : '/';
  redirect(target);
}