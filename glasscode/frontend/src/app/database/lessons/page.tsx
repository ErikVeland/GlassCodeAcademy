import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export default async function LegacyDatabaseLessonsRedirect() {
  const mod = await contentRegistry.findModuleByRoutePath('/database/lessons');
  const target = mod ? `/modules/${mod.slug}/lessons` : '/';
  redirect(target);
}