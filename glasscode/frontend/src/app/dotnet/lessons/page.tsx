import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export default async function LegacyDotnetLessonsRedirect() {
  const mod = await contentRegistry.findModuleByRoutePath('/dotnet/lessons');
  const target = mod ? `/modules/${mod.slug}/lessons` : '/';
  redirect(target);
}