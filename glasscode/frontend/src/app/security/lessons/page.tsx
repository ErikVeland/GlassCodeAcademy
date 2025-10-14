import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export default async function LegacySecurityLessonsRedirect() {
  const mod = await contentRegistry.findModuleByRoutePath('/security/lessons');
  const target = mod ? `/modules/${mod.slug}/lessons` : '/';
  redirect(target);
}