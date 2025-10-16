import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.findModuleByRoutePath('/dotnet');
  
  if (!currentModule) {
    return { title: 'Quiz Question Not Found' };
  }

  return {
    title: `${currentModule.title} Quiz Question`,
    description: `Answer questions to test your ${currentModule.title} knowledge.`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function DotnetQuizQuestionPage() {
  const currentModule = await contentRegistry.findModuleByRoutePath('/dotnet');
  
  if (!currentModule) {
    redirect('/404');
  }

  // Redirect to the module-based quiz question page
  redirect(`/modules/${currentModule.slug}/quiz/question`);
}