import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const lessonOrder = parseInt(resolvedParams.id, 10);
  
  // Find the module by route path
  const mod = await contentRegistry.findModuleByRoutePath('/dotnet');
  if (!mod) {
    return {
      title: 'Lesson Not Found',
      description: 'The requested lesson could not be found.'
    };
  }

  // Get lessons for the module
  const lessons = await contentRegistry.getModuleLessons(mod.slug);
  const lesson = lessons?.find(l => l.order === lessonOrder);
  
  if (!lesson) {
    return {
      title: 'Lesson Not Found',
      description: 'The requested lesson could not be found.'
    };
  }

  return {
    title: `${lesson.title} - ${mod.title}`,
    description: lesson.intro?.substring(0, 160) || `Learn ${lesson.title} in ${mod.title}`
  };
}

export default async function DotnetLessonPage({ params }: Props) {
  const resolvedParams = await params;
  const lessonId = resolvedParams.id;
  
  // Find the module by route path
  const mod = await contentRegistry.findModuleByRoutePath('/dotnet');
  if (!mod) {
    redirect('/404');
  }

  // Redirect to the module-based lesson page
  redirect(`/modules/${mod.slug}/lessons/${lessonId}`);
}