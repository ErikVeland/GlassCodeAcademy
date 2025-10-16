import { notFound, redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.findModuleByRoutePath('/web/lessons');
  
  if (!currentModule) {
    return { title: 'Quiz Not Found' };
  }

  return {
    title: `${currentModule.title} Quiz Question`,
    description: `Answer questions in the ${currentModule.title} quiz.`,
  };
}

export default async function WebQuizQuestionPage() {
  // Find the web-fundamentals module
  const currentModule = await contentRegistry.findModuleByRoutePath('/web/lessons');
  
  if (!currentModule) {
    notFound();
  }

  // Redirect to the module-based quiz question page
  redirect(`/modules/${currentModule.slug}/quiz/question`);
}