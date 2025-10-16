import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const currentModule = await contentRegistry.getModule('performance');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }
  
  const lessons = await contentRegistry.getModuleLessons(currentModule.slug);
  const lesson = lessons.find(l => l.id?.toString() === resolvedParams.id);
  
  if (!lesson) {
    return {
      title: `${currentModule.title} Lesson - Fullstack Learning Platform`,
      description: `Learn ${currentModule.title} through interactive lessons. ${currentModule.description}`,
      keywords: currentModule.technologies.join(', '),
    };
  }
  
  return {
    title: `${lesson.title} - ${currentModule.title} - Fullstack Learning Platform`,
    description: `Learn ${lesson.title} in the ${currentModule.title} module. ${lesson.intro || currentModule.description}`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function PerformanceLessonPage({ params }: Props) {
  const resolvedParams = await params;
  const mod = await contentRegistry.findModuleByRoutePath(`/performance/lessons/${resolvedParams.id}`);
  const target = mod ? `/modules/${mod.slug}/lessons/${resolvedParams.id}` : '/';
  redirect(target);
}