import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export default async function LegacySassLessonsRedirect() {
  const mod = await contentRegistry.findModuleByRoutePath('/sass/lessons');
  const target = mod ? `/modules/${mod.slug}/lessons` : '/';
  redirect(target);
}