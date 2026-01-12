import { redirect, notFound } from "next/navigation";
import { getShortSlugFromModuleSlug } from "@/lib/contentRegistry";

export default async function LegacyLessonsListRedirect({
  params,
}: {
  params: Promise<{ moduleSlug: string }>;
}) {
  const { moduleSlug } = await params;
  const shortSlug = await getShortSlugFromModuleSlug(moduleSlug);
  if (!shortSlug) {
    notFound();
  }
  redirect(`/${shortSlug}/lessons`);
}
