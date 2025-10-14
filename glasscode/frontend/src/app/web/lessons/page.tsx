import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export default async function LegacyWebLessonsRedirect() {
  const mod = await contentRegistry.findModuleByRoutePath('/web/lessons');
  const target = mod ? `/modules/${mod.slug}/lessons` : '/';
  redirect(target);
}