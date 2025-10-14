import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export default async function LegacyNodeLessonsRedirect() {
  const mod = await contentRegistry.findModuleByRoutePath('/node/lessons');
  const target = mod ? `/modules/${mod.slug}/lessons` : '/';
  redirect(target);
}