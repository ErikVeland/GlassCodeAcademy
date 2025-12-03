'use client';

import {useLocale} from 'next-intl';
import {usePathname, useRouter} from '@/i18n/routing';
import {ChangeEvent, useTransition} from 'react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value;
    startTransition(() => {
      router.replace(pathname, {locale: nextLocale});
    });
  }

  return (
    <nav aria-label="Language">
      <select
        defaultValue={locale}
        onChange={onSelectChange}
        disabled={isPending}
        className="bg-transparent py-1 px-2 rounded border border-gray-300 dark:border-gray-700 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
      >
        <option value="en">English</option>
        <option value="nb">Bokmål</option>
        <option value="nn">Nynorsk</option>
      </select>
    </nav>
  );
}
