import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export default async function LegacyProgrammingLessonsRedirect() {
  const mod = await contentRegistry.findModuleByRoutePath('/programming/lessons');
  const target = mod ? `/modules/${mod.slug}/lessons` : '/';
  redirect(target);
}