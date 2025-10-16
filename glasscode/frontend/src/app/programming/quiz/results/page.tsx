import { notFound, redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.findModuleByRoutePath('/programming/lessons');
  
  if (!currentModule) {
    return { title: 'Quiz Not Found' };
  }

  return {
    title: `${currentModule.title} Quiz Results`,
    description: `View your results for the ${currentModule.title} quiz.`,
  };
}

export default async function ProgrammingQuizResultsPage() {
  // Find the programming-fundamentals module
  const currentModule = await contentRegistry.findModuleByRoutePath('/programming/lessons');
  
  if (!currentModule) {
    notFound();
  }

  // Redirect to the module-based quiz results page
  redirect(`/modules/${currentModule.slug}/quiz/results`);
}