import { redirect, notFound } from 'next/navigation';
import { getShortSlugFromModuleSlug } from '@/lib/contentRegistry';

export default async function LegacyQuizQuestionRedirect({ params }: { params: { moduleSlug: string; questionId: string } }) {
  const { moduleSlug, questionId } = params;
  const shortSlug = await getShortSlugFromModuleSlug(moduleSlug);
  if (!shortSlug) {
    notFound();
  }
  redirect(`/${shortSlug}/quiz/question/${questionId}`);
}