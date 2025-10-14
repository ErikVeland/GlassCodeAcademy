import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export default async function LegacyTailwindLessonsRedirect() {
  const mod = await contentRegistry.findModuleByRoutePath('/tailwind/lessons');
  const target = mod ? `/modules/${mod.slug}/lessons` : '/';
  redirect(target);
}