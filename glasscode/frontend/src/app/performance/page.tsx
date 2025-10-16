import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('performance');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `${currentModule.title} - Fullstack Learning Platform`,
    description: currentModule.description,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function PerformancePage() {
  const mod = await contentRegistry.findModuleByRoutePath('/performance');
  const target = mod ? `/modules/${mod.slug}` : '/';
  redirect(target);
}