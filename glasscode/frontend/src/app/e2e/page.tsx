import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('e2e');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `${currentModule.title} - Fullstack Learning Platform`,
    description: currentModule.description,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function E2EPage() {
  const mod = await contentRegistry.findModuleByRoutePath('/e2e');
  const target = mod ? `/modules/${mod.slug}` : '/';
  redirect(target);
}