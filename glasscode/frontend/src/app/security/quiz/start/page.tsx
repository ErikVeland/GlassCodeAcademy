import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('security');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `Start ${currentModule.title} Quiz - Fullstack Learning Platform`,
    description: `Begin your ${currentModule.title} quiz. Test your knowledge of ${currentModule.technologies.join(', ')}.`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function SecurityQuizStartPage() {
  const mod = await contentRegistry.findModuleByRoutePath('/security/quiz/start');
  const target = mod ? `/modules/${mod.slug}/quiz/start` : '/';
  redirect(target);
}