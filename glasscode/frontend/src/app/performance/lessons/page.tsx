import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export default async function LegacyPerformanceLessonsRedirect() {
  const mod = await contentRegistry.findModuleByRoutePath('/performance/lessons');
  const target = mod ? `/modules/${mod.slug}/lessons` : '/';
  redirect(target);
}