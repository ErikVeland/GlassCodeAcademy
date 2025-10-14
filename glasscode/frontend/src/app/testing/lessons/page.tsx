import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export default async function LegacyTestingLessonsRedirect() {
  const mod = await contentRegistry.findModuleByRoutePath('/testing/lessons');
  const target = mod ? `/modules/${mod.slug}/lessons` : '/';
  redirect(target);
}