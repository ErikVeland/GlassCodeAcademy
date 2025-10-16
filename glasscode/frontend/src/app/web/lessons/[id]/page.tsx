import { notFound, redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';
import { Metadata } from 'next';

interface WebLessonPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: WebLessonPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const lessonOrderNum = parseInt(resolvedParams.id, 10);
  
  const currentModule = await contentRegistry.findModuleByRoutePath('/web/lessons');
  
  if (!currentModule) {
    return { title: 'Lesson Not Found' };
  }

  const lessons = await contentRegistry.getModuleLessons(currentModule.slug);
  const lesson = lessons?.find(l => l.order === lessonOrderNum);

  if (!lesson) {
    return { title: 'Lesson Not Found' };
  }

  return {
    title: `${lesson.title} - ${currentModule.title}`,
    description: lesson.intro?.substring(0, 160) || `Learn ${lesson.title} in ${currentModule.title}`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function WebLessonPage({ params }: WebLessonPageProps) {
  const resolvedParams = await params;
  
  // Find the web-fundamentals module
  const currentModule = await contentRegistry.findModuleByRoutePath('/web/lessons');
  
  if (!currentModule) {
    notFound();
  }

  // Redirect to the module-based lesson page for now
  redirect(`/modules/${currentModule.slug}/lessons/${resolvedParams.id}`);
}