import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export default async function LegacyTypescriptLessonsRedirect() {
  const mod = await contentRegistry.findModuleByRoutePath('/typescript/lessons');
  const target = mod ? `/modules/${mod.slug}/lessons` : '/';
  redirect(target);
}