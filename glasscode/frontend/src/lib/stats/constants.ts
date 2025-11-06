// Shared constants and helpers for stats feature

// Palette used for module breakdown visualization
export const moduleColors = [
  '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
  '#14B8A6', '#F59E0B', '#8B5CF6', '#EF4444', '#10B981',
  '#3B82F6', '#F97316'
];

// Derive short slug reliably from a canonical module slug
export function toShortSlug(slug: string): string {
  const s = (slug || '').toString();
  if (!s) return '';
  const explicitMap: Record<string, string> = {
    'programming-fundamentals': 'programming',
    'web-fundamentals': 'web',
    'version-control': 'version',
    'dotnet-fundamentals': 'dotnet',
    'react-fundamentals': 'react',
    'database-systems': 'database',
    'typescript-fundamentals': 'typescript',
    'node-fundamentals': 'node',
    'laravel-fundamentals': 'laravel',
    'nextjs-advanced': 'nextjs',
    'graphql-advanced': 'graphql',
    'sass-advanced': 'sass',
    'tailwind-advanced': 'tailwind',
    'vue-advanced': 'vue',
    'testing-fundamentals': 'testing',
    'e2e-testing': 'e2e',
    'performance-optimization': 'performance',
    'security-fundamentals': 'security',
  };
  if (explicitMap[s]) return explicitMap[s];
  return s.includes('-') ? s.split('-')[0] : s;
}