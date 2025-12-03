import {Link} from '@/i18n/routing';
import {useTranslations} from 'next-intl';
import {ReactNode} from 'react';
import AdvancedBackground from '../visual/AdvancedBackground';
import AnimationToggle from '../visual/AnimationToggle';
import GlassLogo from './GlassLogo';
import PremiumGlassLogo from './PremiumGlassLogo';
import SettingsMenu from '../SettingsMenu';
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
    <div className="min-h-screen flex flex-col relative">
      {/* Advanced Fluid Background */}
      <AdvancedBackground />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:ring-2 focus:ring-primary focus:rounded-md shadow-lg"
      >
        Skip to main content
      </a>

      <header className="glass-strong sticky top-0 z-40 border-b border-border/50">
        <div className="prose-content py-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <Link 
              href="/" 
              className="focus:outline-none focus-ring-glow rounded-sm block transition-transform duration-300 hover:scale-105"
            >
              <GlassLogo />
            </Link>          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            <nav className="flex flex-wrap justify-center gap-6 md:gap-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className="relative text-base font-medium text-foreground/80 hover:text-primary transition-colors focus:outline-none focus-ring-glow rounded-sm group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-4 border-l border-border/50 pl-6">
              <SettingsMenu />
            </div>          </div>
        </div>
      </header>

      <main id="main-content" className="flex-grow w-full focus:outline-none" tabIndex={-1}>
        {children}
      </main>

      <footer className="border-t border-border/50 mt-auto glass-subtle">
        <div className="prose-content py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-muted-foreground text-center md:text-left flex items-center justify-center md:justify-start gap-2 flex-wrap">
              © {new Date().getFullYear()} <GlassLogo />. All rights reserved.
            </p>
            <AnimationToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}
