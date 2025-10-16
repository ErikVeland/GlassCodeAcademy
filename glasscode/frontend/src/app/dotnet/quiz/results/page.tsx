import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.findModuleByRoutePath('/dotnet');
  
  if (!currentModule) {
    return { title: 'Quiz Results Not Found' };
  }

  return {
    title: `${currentModule.title} Quiz Results`,
    description: `View your ${currentModule.title} quiz results and performance analysis.`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function DotnetQuizResultsPage() {
  const currentModule = await contentRegistry.findModuleByRoutePath('/dotnet');
  
  if (!currentModule) {
    redirect('/404');
  }

  // Redirect to the module-based quiz results page
  redirect(`/modules/${currentModule.slug}/quiz/results`);
}