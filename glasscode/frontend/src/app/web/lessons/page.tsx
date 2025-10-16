import { notFound, redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.findModuleByRoutePath('/web/lessons');
  
  if (!currentModule) {
    return { title: 'Lessons Not Found' };
  }

  return {
    title: `${currentModule.title} Lessons - Learn Web Development`,
    description: `Explore ${currentModule.title} lessons and start your web development journey.`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function WebLessonsPage() {
  // Find the web-fundamentals module
  const currentModule = await contentRegistry.findModuleByRoutePath('/web/lessons');
  
  if (!currentModule) {
    notFound();
  }

  // Redirect to the module-based lessons page for now
  redirect(`/modules/${currentModule.slug}/lessons`);
}