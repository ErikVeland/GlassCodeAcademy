type ModuleTheme = { strip: string };

const themes: Record<string, ModuleTheme> = {
  'react-fundamentals': { strip: 'bg-gradient-to-r from-[#61DAFB] to-[#1B9EAF]' },
  'graphql-advanced': { strip: 'bg-gradient-to-r from-[#E10098] to-[#8E0F6F]' },
  'typescript-fundamentals': { strip: 'bg-gradient-to-r from-[#3178C6] to-[#115EA3]' },
  'node-fundamentals': { strip: 'bg-gradient-to-r from-[#3C873A] to-[#68A063]' },
  'nextjs-advanced': { strip: 'bg-gradient-to-r from-gray-900 to-gray-700' },
  'laravel-fundamentals': { strip: 'bg-gradient-to-r from-[#FF2D20] to-[#B2170E]' },
  'tailwind-advanced': { strip: 'bg-gradient-to-r from-[#38B2AC] to-[#14B8A6]' },
  'vue-advanced': { strip: 'bg-gradient-to-r from-[#42B883] to-[#35495E]' },
  'dotnet-fundamentals': { strip: 'bg-gradient-to-r from-[#512BD4] to-[#8A2BE2]' },
  'database-systems': { strip: 'bg-gradient-to-r from-[#336791] to-[#1F4E7A]' },
  'web-fundamentals': { strip: 'bg-gradient-to-r from-indigo-600 to-sky-500' },
  'programming-fundamentals': { strip: 'bg-gradient-to-r from-purple-600 to-pink-500' },
  'version-control': { strip: 'bg-gradient-to-r from-orange-500 to-rose-500' },
  'testing-fundamentals': { strip: 'bg-gradient-to-r from-[#6D28D9] to-[#9333EA]' },
  'performance-optimization': { strip: 'bg-gradient-to-r from-[#EF4444] to-[#F59E0B]' },
  'security-fundamentals': { strip: 'bg-gradient-to-r from-[#0EA5E9] to-[#6366F1]' },
  'e2e-testing': { strip: 'bg-gradient-to-r from-[#10B981] to-[#3B82F6]' },
};

export function getModuleTheme(slug: string): ModuleTheme {
  return themes[slug] || { strip: 'bg-gradient-to-r from-blue-600 to-sky-500' };
}