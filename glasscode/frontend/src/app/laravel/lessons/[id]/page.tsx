import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const currentModule = await contentRegistry.findModuleByRoutePath('/laravel/lessons');
  if (!currentModule) {
    return { title: 'Module Not Found' };
  }

  const lessons = await contentRegistry.getModuleLessons(currentModule.slug);
  const lessonOrder = parseInt(resolvedParams.id, 10);
  const lesson = lessons?.find(l => l.order === lessonOrder);

  if (!lesson) {
    return {
      title: `Lesson Not Found - ${currentModule.title}`,
      description: `The requested lesson in ${currentModule.title} could not be found.`,
    };
  }

  return {
    title: `${lesson.title} - ${currentModule.title} - Fullstack Learning Platform`,
    description: lesson.intro || `Learn ${lesson.title} in our ${currentModule.title} course.`,
    keywords: currentModule.technologies.join(', '),
  };
}

export default async function LaravelLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const mod = await contentRegistry.findModuleByRoutePath('/laravel/lessons');
  const target = mod ? `/modules/${mod.slug}/lessons/${resolvedParams.id}` : '/';
  redirect(target);
}