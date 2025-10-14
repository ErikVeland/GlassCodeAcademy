import { redirect } from 'next/navigation';
import { contentRegistry } from '@/lib/contentRegistry';

export default async function LegacyGraphqlLessonsRedirect() {
  const mod = await contentRegistry.findModuleByRoutePath('/graphql/lessons');
  const target = mod ? `/modules/${mod.slug}/lessons` : '/';
  redirect(target);
}