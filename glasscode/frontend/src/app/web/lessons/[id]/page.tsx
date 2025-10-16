import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

interface LegacyWebLessonPageProps {
  params: Promise<{ id: string }>;
}

export default async function LegacyWebLessonRedirect({ params }: LegacyWebLessonPageProps) {
  const resolvedParams = await params;
  const lessonId = resolvedParams.id;
  
  // Find the module that handles /web/lessons
  const mod = await contentRegistry.findModuleByRoutePath('/web/lessons');
  
  if (mod) {
    // Redirect to the new module-based URL structure
    redirect(`/modules/${mod.slug}/lessons/${lessonId}`);
  } else {
    // Fallback: redirect to home if no module found
    redirect('/');
  }
}