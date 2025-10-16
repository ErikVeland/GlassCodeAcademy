import { notFound, redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';
import { Metadata } from 'next';

interface VersionLessonPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: VersionLessonPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const lessonOrderNum = parseInt(resolvedParams.id, 10);
  
  const currentModule = await contentRegistry.findModuleByRoutePath('/version/lessons');
  
  if (!currentModule) {
    return { title: 'Lesson Not Found' };
  }

  const lessons = await contentRegistry.getModuleLessons(currentModule.slug);
  const lesson = lessons?.find(l => l.order === lessonOrderNum);

  return {
    title: lesson ? `${lesson.title} - ${currentModule.title}` : `Lesson ${lessonOrderNum} - ${currentModule.title}`,
    description: lesson?.intro?.substring(0, 160) || `Learn ${currentModule.title} concepts in this comprehensive lesson.`,
  };
}

export default async function VersionLessonPage({ params }: VersionLessonPageProps) {
  const resolvedParams = await params;
  
  // Find the version-control module
  const currentModule = await contentRegistry.findModuleByRoutePath('/version/lessons');
  
  if (!currentModule) {
    notFound();
  }

  // Redirect to the module-based lesson page for now
  redirect(`/modules/${currentModule.slug}/lessons/${resolvedParams.id}`);
}