import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('e2e');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `${currentModule.title} Quiz Question - Fullstack Learning Platform`,
    description: `Answer ${currentModule.title} quiz questions. ${currentModule.description}`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function E2EQuizQuestionPage() {
  const mod = await contentRegistry.findModuleByRoutePath('/e2e/quiz/question');
  const target = mod ? `/modules/${mod.slug}/quiz/question` : '/';
  redirect(target);
}