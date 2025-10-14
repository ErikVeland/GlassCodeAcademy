import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export default async function LegacyNextjsLessonsRedirect() {
  const mod = await contentRegistry.findModuleByRoutePath('/nextjs/lessons');
  const target = mod ? `/modules/${mod.slug}/lessons` : '/';
  redirect(target);
}