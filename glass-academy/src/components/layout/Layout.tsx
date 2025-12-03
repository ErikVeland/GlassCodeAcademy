import {Link} from '@/i18n/routing';
import {useTranslations} from 'next-intl';
import {ReactNode} from 'react';
import LanguageSwitcher from '../LanguageSwitcher';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const t = useTranslations('nav');
  const tSite = useTranslations('site');

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:ring-2 focus:ring-primary focus:rounded-md"
      >
        Skip to main content
      </a>

      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="prose-content py-4 flex justify-between items-center">
          <div className="font-bold text-xl">
            <Link href="/">{tSite('title')}</Link>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-6">
              <Link href="/" className="hover:text-primary transition-colors">{t('home')}</Link>
              <Link href="/work" className="hover:text-primary transition-colors">{t('work')}</Link>
              <Link href="/services" className="hover:text-primary transition-colors">{t('services')}</Link>
              <Link href="/process" className="hover:text-primary transition-colors">{t('process')}</Link>
              <Link href="/about" className="hover:text-primary transition-colors">{t('about')}</Link>
              <Link href="/contact" className="hover:text-primary transition-colors">{t('contact')}</Link>
            </nav>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-grow prose-content py-8 w-full">
        {children}
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 mt-auto">
        <div className="prose-content py-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} {tSite('title')}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
