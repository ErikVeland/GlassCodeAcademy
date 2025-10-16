import { notFound, redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.findModuleByRoutePath('/version/lessons');
  
  if (!currentModule) {
    return { title: 'Lessons Not Found' };
  }

  return {
    title: `${currentModule.title} Lessons - Learn Step by Step`,
    description: `Explore ${currentModule.title} through our comprehensive lesson series.`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function VersionLessonsPage() {
  // Find the version-control module
  const currentModule = await contentRegistry.findModuleByRoutePath('/version/lessons');
  
  if (!currentModule) {
    notFound();
  }

  // Redirect to the module-based lessons page for now
  redirect(`/modules/${currentModule.slug}/lessons`);
}