import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export default async function LegacyLaravelLessonsRedirect() {
  const mod = await contentRegistry.findModuleByRoutePath('/laravel/lessons');
  const target = mod ? `/modules/${mod.slug}/lessons` : '/';
  redirect(target);
}