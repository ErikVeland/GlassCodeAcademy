import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const currentModule = await contentRegistry.getModule('testing');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  return {
    title: `${currentModule.title} - Fullstack Learning Platform`,
    description: currentModule.description,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function TestingPage() {
  const currentModule = await contentRegistry.getModule('testing');
  
  if (!currentModule) {
    redirect('/');
    return;
  }

  // For now, redirect to the module-based route
  // This maintains compatibility while providing clean URLs
  redirect(`/modules/${currentModule.slug}`);
}