'use client';

import {useLocale} from 'next-intl';
import {usePathname, Link} from '@/i18n/routing';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'nb', label: 'Bokmål' },
    { code: 'nn', label: 'Nynorsk' }
  ];

  return (
    <nav aria-label="Language" className="flex gap-2">
      {languages.map((lang) => (
        <Link
          key={lang.code}
          href={pathname}
          locale={lang.code}
          className={`px-2 py-1 text-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
            locale === lang.code
              ? 'bg-gray-100 dark:bg-gray-800 font-medium text-foreground'
              : 'text-gray-500 hover:text-foreground hover:bg-gray-50 dark:hover:bg-gray-900'
          }`}
          aria-current={locale === lang.code ? 'page' : undefined}
        >
          {lang.label}
        </Link>
      ))}
    </nav>
  );
}
