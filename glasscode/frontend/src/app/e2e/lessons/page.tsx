import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export default async function LegacyE2eLessonsRedirect() {
  const mod = await contentRegistry.findModuleByRoutePath('/e2e/lessons');
  const target = mod ? `/modules/${mod.slug}/lessons` : '/';
  redirect(target);
}