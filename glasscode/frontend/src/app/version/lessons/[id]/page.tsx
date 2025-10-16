import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

interface LegacyVersionLessonPageProps {
  params: Promise<{ id: string }>;
}

export default async function LegacyVersionLessonRedirect({ params }: LegacyVersionLessonPageProps) {
  const resolvedParams = await params;
  const lessonId = resolvedParams.id;
  
  // Find the module that handles /version/lessons
  const mod = await contentRegistry.findModuleByRoutePath('/version/lessons');
  
  if (mod) {
    // Redirect to the new module-based URL structure
    redirect(`/modules/${mod.slug}/lessons/${lessonId}`);
  } else {
    // Fallback: redirect to home if no module found
    redirect('/');
  }
}