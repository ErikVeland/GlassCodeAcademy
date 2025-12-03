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

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/work', label: t('work') },
    { href: '/services', label: t('services') },
    { href: '/process', label: t('process') },
    { href: '/about', label: t('about') },
    { href: '/contact', label: t('contact') },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:ring-2 focus:ring-primary focus:rounded-md shadow-lg"
      >
        Skip to main content
      </a>

      <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-background/80 backdrop-blur-sm z-40">
        <div className="prose-content py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-bold text-xl">
            <Link 
              href="/" 
              className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
            >
              {tSite('title')}
            </Link>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            <nav className="flex flex-wrap justify-center gap-4 md:gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className="text-sm font-medium hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="border-l border-gray-200 dark:border-gray-700 pl-6 hidden md:block">
              <LanguageSwitcher />
            </div>
            <div className="md:hidden">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-grow prose-content py-8 w-full focus:outline-none" tabIndex={-1}>
        {children}
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 mt-auto bg-gray-50 dark:bg-gray-900/50">
        <div className="prose-content py-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} {tSite('title')}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
