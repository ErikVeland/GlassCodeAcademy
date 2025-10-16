import { notFound, redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.findModuleByRoutePath('/version/lessons');
  
  if (!currentModule) {
    return { title: 'Quiz Not Found' };
  }

  return {
    title: `Start ${currentModule.title} Quiz`,
    description: `Begin the ${currentModule.title} quiz to test your knowledge and understanding.`,
  };
}

export default async function VersionQuizStartPage() {
  // Find the version-control module
  const currentModule = await contentRegistry.findModuleByRoutePath('/version/lessons');
  
  if (!currentModule) {
    notFound();
  }

  // Redirect to the module-based quiz start page
  redirect(`/modules/${currentModule.slug}/quiz/start`);
}