type ModuleTheme = {
  strip: string;
  button: string;
  link: string;
  accent: string;
  mark: string;
};

const themes: Record<string, ModuleTheme> = {
  'react-fundamentals': {
    strip: 'bg-[#1B9EAF]',
    accent: '#1B9EAF',
    mark: 'RX',
    button:
      'bg-sky-600/85 hover:bg-sky-700/85 text-white focus:ring-sky-300/50 dark:focus:ring-sky-400/40',
    link: 'text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300',
  },
  'graphql-advanced': {
    strip: 'bg-[#B0177E]',
    accent: '#B0177E',
    mark: 'GQL',
    button:
      'bg-pink-600/85 hover:bg-pink-700/85 text-white focus:ring-pink-300/50 dark:focus:ring-pink-400/40',
    link: 'text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-300',
  },
  'typescript-fundamentals': {
    strip: 'bg-[#3178C6]',
    accent: '#3178C6',
    mark: 'TS',
    button:
      'bg-blue-700/85 hover:bg-blue-800/85 text-white focus:ring-blue-300/50 dark:focus:ring-blue-400/40',
    link: 'text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300',
  },
  'node-fundamentals': {
    strip: 'bg-[#3C873A]',
    accent: '#3C873A',
    mark: 'ND',
    button:
      'bg-green-700/85 hover:bg-green-800/85 text-white focus:ring-green-300/50 dark:focus:ring-green-400/40',
    link: 'text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300',
  },
  'nextjs-advanced': {
    strip: 'bg-gray-900',
    accent: '#111827',
    mark: 'NX',
    button:
      'bg-gray-900 hover:bg-gray-800 text-white focus:ring-gray-300/50 dark:focus:ring-gray-400/40',
    link: 'text-gray-900 hover:text-black dark:text-gray-300 dark:hover:text-white',
  },
  'laravel-fundamentals': {
    strip: 'bg-[#D93B2E]',
    accent: '#D93B2E',
    mark: 'LV',
    button:
      'bg-red-600/85 hover:bg-red-700/85 text-white focus:ring-red-300/50 dark:focus:ring-red-400/40',
    link: 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300',
  },
  'tailwind-advanced': {
    strip: 'bg-[#138F8A]',
    accent: '#138F8A',
    mark: 'TW',
    button:
      'bg-teal-600/85 hover:bg-teal-700/85 text-white focus:ring-teal-300/50 dark:focus:ring-teal-400/40',
    link: 'text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300',
  },
  'vue-advanced': {
    strip: 'bg-[#2E8F69]',
    accent: '#2E8F69',
    mark: 'VU',
    button:
      'bg-emerald-600/85 hover:bg-emerald-700/85 text-white focus:ring-emerald-300/50 dark:focus:ring-emerald-400/40',
    link: 'text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300',
  },
  'dotnet-fundamentals': {
    strip: 'bg-[#6E45D8]',
    accent: '#6E45D8',
    mark: '.NET',
    button:
      'bg-indigo-700/85 hover:bg-indigo-800/85 text-white focus:ring-indigo-300/50 dark:focus:ring-indigo-400/40',
    link: 'text-indigo-700 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300',
  },
  'database-systems': {
    strip: 'bg-[#336791]',
    accent: '#336791',
    mark: 'SQL',
    button:
      'bg-blue-800/85 hover:bg-blue-900/85 text-white focus:ring-blue-300/50 dark:focus:ring-blue-400/40',
    link: 'text-blue-800 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300',
  },
  'web-fundamentals': {
    strip: 'bg-indigo-600',
    accent: '#4F46E5',
    mark: 'WEB',
    button:
      'bg-indigo-600/85 hover:bg-indigo-700/85 text-white focus:ring-indigo-300/50 dark:focus:ring-indigo-400/40',
    link: 'text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300',
  },
  'programming-fundamentals': {
    strip: 'bg-[#7C3AED]',
    accent: '#7C3AED',
    mark: 'DEV',
    button:
      'bg-purple-600/85 hover:bg-purple-700/85 text-white focus:ring-purple-300/50 dark:focus:ring-purple-400/40',
    link: 'text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300',
  },
  'version-control': {
    strip: 'bg-[#D84A2E]',
    accent: '#D84A2E',
    mark: 'GIT',
    button:
      'bg-orange-600/85 hover:bg-orange-700/85 text-white focus:ring-orange-300/50 dark:focus:ring-orange-400/40',
    link: 'text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300',
  },
  'testing-fundamentals': {
    strip: 'bg-[#6D28D9]',
    accent: '#6D28D9',
    mark: 'TST',
    button:
      'bg-violet-700/85 hover:bg-violet-800/85 text-white focus:ring-violet-300/50 dark:focus:ring-violet-400/40',
    link: 'text-violet-700 hover:text-violet-900 dark:text-violet-400 dark:hover:text-violet-300',
  },
  'performance-optimization': {
    strip: 'bg-[#C2410C]',
    accent: '#C2410C',
    mark: 'PERF',
    button:
      'bg-red-600/85 hover:bg-red-700/85 text-white focus:ring-red-300/50 dark:focus:ring-red-400/40',
    link: 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300',
  },
  'security-fundamentals': {
    strip: 'bg-[#2563EB]',
    accent: '#2563EB',
    mark: 'SEC',
    button:
      'bg-indigo-600/85 hover:bg-indigo-700/85 text-white focus:ring-indigo-300/50 dark:focus:ring-indigo-400/40',
    link: 'text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300',
  },
  'e2e-testing': {
    strip: 'bg-[#0F766E]',
    accent: '#0F766E',
    mark: 'E2E',
    button:
      'bg-teal-600/85 hover:bg-teal-700/85 text-white focus:ring-teal-300/50 dark:focus:ring-teal-400/40',
    link: 'text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300',
  },
  'sass-advanced': {
    strip: 'bg-[#B85485]',
    accent: '#B85485',
    mark: 'SASS',
    button:
      'bg-pink-600/85 hover:bg-pink-700/85 text-white focus:ring-pink-300/50 dark:focus:ring-pink-400/40',
    link: 'text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-300',
  },
};

export function getModuleTheme(slug: string): ModuleTheme {
  return (
    themes[slug] || {
      strip: 'bg-blue-600',
      accent: '#2563EB',
      mark: 'GC',
      button:
        'bg-blue-600/85 hover:bg-blue-700/85 text-white focus:ring-blue-300/50 dark:focus:ring-blue-400/40',
      link: 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300',
    }
  );
}

// Technology brand chip classes (WCAG-conscious light/dark variants)
export function getTechnologyChipClasses(tech: string): string {
  const t = tech.toLowerCase();
  if (t.includes('react'))
    return 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200';
  if (t.includes('typescript') || t === 'ts')
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  if (t.includes('graphql'))
    return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
  if (t.includes('node'))
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (t.includes('next'))
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  if (t.includes('laravel'))
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  if (t.includes('tailwind'))
    return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
  if (t.includes('vue'))
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
  if (t.includes('sass') || t.includes('scss'))
    return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
  if (t.includes('.net') || t.includes('dotnet'))
    return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
  if (t.includes('postgres') || t.includes('sql'))
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  if (t.includes('git') || t.includes('version'))
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  if (t.includes('testing') || t.includes('jest'))
    return 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200';
  if (t.includes('cypress') || t.includes('playwright') || t.includes('e2e'))
    return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
  if (t.includes('security'))
    return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
  if (t.includes('performance') || t.includes('optimization'))
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  // Generic technology fallback
  return 'bg-surface-alt text-muted border border-border';
}
