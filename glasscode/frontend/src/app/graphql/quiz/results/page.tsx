import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('graphql');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `${currentModule.title} Quiz Results - Fullstack Learning Platform`,
    description: `View your ${currentModule.title} quiz results and see how well you understand ${currentModule.technologies.join(', ')}.`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function GraphqlQuizResultsPage() {
  const mod = await contentRegistry.findModuleByRoutePath('/graphql/quiz/results');
  const target = mod ? `/modules/${mod.slug}/quiz/results` : '/';
  redirect(target);
}