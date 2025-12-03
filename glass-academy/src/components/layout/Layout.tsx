import {Link} from '@/i18n/routing';
import {useTranslations} from 'next-intl';
import {ReactNode} from 'react';
import AdvancedBackground from '../visual/AdvancedBackground';
import AnimationToggle from '../visual/AnimationToggle';
import GlassLogo from './GlassLogo';
import SettingsMenu from '../SettingsMenu';
import MobileMenu from './MobileMenu';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const t = useTranslations('nav');

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link 
              href="/" 
              className="flex-shrink-0 focus:outline-none focus-ring-glow rounded-sm transition-transform duration-300 hover:scale-105"
            >
              <GlassLogo />
            </Link>

            {/* Desktop Navigation - Single Line */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className="relative text-base font-medium text-foreground/80 hover:text-primary transition-colors focus:outline-none focus-ring-glow rounded-sm group whitespace-nowrap"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </nav>

            {/* Right Side - Settings + Mobile Menu */}
            <div className="flex items-center gap-4">
              <SettingsMenu />
              <MobileMenu navLinks={navLinks} />
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-grow prose-content py-8 w-full focus:outline-none" tabIndex={-1}>
        {children}
      </main>

      <footer className="border-t border-border/50 mt-auto glass-subtle">
        <div className="prose-content py-12">
          <div className="flex flex-row flex-wrap justify-between items-center gap-6">
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
