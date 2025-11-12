import { redirect, notFound } from "next/navigation";
import { getShortSlugFromModuleSlug } from "@/lib/contentRegistry";

export default async function LegacyQuizQuestionRedirect({
  params,
}: {
  params: Promise<{ moduleSlug: string; questionId: string }>;
}) {
  const { moduleSlug, questionId } = await params;
  const shortSlug = await getShortSlugFromModuleSlug(moduleSlug);
  if (!shortSlug) {
    notFound();
  }
  redirect(`/${shortSlug}/quiz/question/${questionId}`);
}
