import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('react-fundamentals');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `Start ${currentModule.title} Quiz - Fullstack Learning Platform`,
    description: `Begin your ${currentModule.title} quiz to test your knowledge and skills. ${currentModule.description}`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function ReactQuizStartPage() {
  const currentModule = await contentRegistry.findModuleByRoutePath('/react/quiz/start');
  const target = currentModule ? `/modules/${currentModule.slug}/quiz/start` : '/';
  redirect(target);
}