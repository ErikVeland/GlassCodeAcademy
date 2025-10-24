import { redirect, notFound } from 'next/navigation';
import { getShortSlugFromModuleSlug } from '@/lib/contentRegistry';

export default async function LegacyLessonDetailRedirect({ params }: { params: { moduleSlug: string; lessonOrder: string } }) {
  const { moduleSlug, lessonOrder } = params;
  const shortSlug = await getShortSlugFromModuleSlug(moduleSlug);
  if (!shortSlug) {
    notFound();
  }
  redirect(`/${shortSlug}/lessons/${lessonOrder}`);
}