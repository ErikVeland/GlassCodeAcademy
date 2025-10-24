import { redirect, notFound } from 'next/navigation';
import { getShortSlugFromModuleSlug } from '@/lib/contentRegistry';

export default async function LegacyQuizResultsRedirect({ params }: { params: { moduleSlug: string } }) {
  const { moduleSlug } = params;
  const shortSlug = await getShortSlugFromModuleSlug(moduleSlug);
  if (!shortSlug) {
    notFound();
  }
  redirect(`/${shortSlug}/quiz/results`);
}