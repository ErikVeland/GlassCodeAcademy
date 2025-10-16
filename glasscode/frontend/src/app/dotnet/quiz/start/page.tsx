import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.findModuleByRoutePath('/dotnet');
  
  if (!currentModule) {
    return { title: 'Quiz Not Found' };
  }

  return {
    title: `Start ${currentModule.title} Quiz`,
    description: `Begin your ${currentModule.title} quiz to test your knowledge and skills.`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function DotnetQuizStartPage() {
  const currentModule = await contentRegistry.findModuleByRoutePath('/dotnet');
  
  if (!currentModule) {
    redirect('/404');
  }

  // Redirect to the module-based quiz start page
  redirect(`/modules/${currentModule.slug}/quiz/start`);
}