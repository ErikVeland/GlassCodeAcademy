import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const lessonOrderNum = parseInt(id, 10);
  
  if (isNaN(lessonOrderNum)) {
    return { title: 'Invalid Lesson' };
  }

  const currentModule = await contentRegistry.findModuleByRoutePath('/database/lessons');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }

  const lessons = await contentRegistry.getModuleLessons(currentModule.slug);
  const lesson = lessons?.find((l) => l.order === lessonOrderNum);

  if (!lesson) {
    return { title: 'Lesson Not Found' };
  }

  return {
    title: `${lesson.title} - ${currentModule.title} - Fullstack Learning Platform`,
    description: lesson.intro || `Learn ${lesson.title} in the ${currentModule.title} module.`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function DatabaseLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentModule = await contentRegistry.findModuleByRoutePath('/database/lessons');
  const target = currentModule ? `/modules/${currentModule.slug}/lessons/${id}` : '/';
  redirect(target);
}