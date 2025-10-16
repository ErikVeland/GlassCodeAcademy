import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.findModuleByRoutePath('/dotnet');
  
  if (!currentModule) {
    return { title: 'Lessons Not Found' };
  }

  return {
    title: `${currentModule.title} Lessons`,
    description: `Learn ${currentModule.title} through structured lessons and practical examples.`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function DotnetLessonsPage() {
  const mod = await contentRegistry.findModuleByRoutePath('/dotnet');
  const target = mod ? `/modules/${mod.slug}/lessons` : '/';
  redirect(target);
}