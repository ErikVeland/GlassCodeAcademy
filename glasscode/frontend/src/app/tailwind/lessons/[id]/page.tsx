import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const currentModule = await contentRegistry.findModuleByRoutePath('/tailwind/lessons');
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

export default async function TailwindLessonPage({ params }: Props) {
  const resolvedParams = await params;
  const mod = await contentRegistry.findModuleByRoutePath('/tailwind/lessons');
  const target = mod ? `/modules/${mod.slug}/lessons/${resolvedParams.id}` : '/';
  redirect(target);
}