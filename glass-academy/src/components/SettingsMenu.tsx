'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useLocale } from 'next-intl';
import { usePathname, Link } from '@/i18n/routing';
import { useState, useRef, useEffect } from 'react';

const themes = [
  { value: 'light' as const, label: 'Light', icon: '☀️' },
  { value: 'dark' as const, label: 'Dark', icon: '🌙' },
  { value: 'auto' as const, label: 'System', icon: '💻' },
];

export default function SettingsMenu() {
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentTheme = themes.find(t => t.value === theme);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'nb', label: 'Bokmål' },
    { code: 'nn', label: 'Nynorsk' }
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const firstButton = menuRef.current?.querySelector('button');
      firstButton?.focus();
    }
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent, index: number, totalItems: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % totalItems;
      const nextButton = menuRef.current?.querySelectorAll('button')[nextIndex];
      (nextButton as HTMLButtonElement)?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = index === 0 ? totalItems - 1 : index - 1;
      const prevButton = menuRef.current?.querySelectorAll('button')[prevIndex];
      (prevButton as HTMLButtonElement)?.focus();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  const handleThemeSelect = (value: 'light' | 'dark' | 'auto') => {
    setTheme(value);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const totalMenuItems = themes.length + languages.length;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="flex items-center justify-center p-2 text-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full w-10 h-10"
        aria-label="Site settings menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          viewBox="0 0 20 20" 
          fill="currentColor"
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-md shadow-lg z-50 py-1"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="settings-menu"
        >
          {/* Theme Section */}
          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Theme
          </div>
          {themes.map((t, index) => (
            <button
              key={t.value}
              onClick={() => handleThemeSelect(t.value)}
              onKeyDown={(e) => handleMenuKeyDown(e, index, totalMenuItems)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-muted-background transition-colors focus:outline-none focus:bg-muted-background ${
                theme === t.value ? 'bg-muted-background font-medium' : ''
              }`}
              role="menuitem"
              aria-label={`${t.label} theme${theme === t.value ? ' (current)' : ''}`}
            >
              <span className="text-base" aria-hidden="true">{t.icon}</span>
              <span>{t.label}</span>
              {theme === t.value && (
                <span className="ml-auto text-primary" aria-hidden="true">✓</span>
              )}
            </button>
          ))}

          {/* Language Section */}
          <div className="border-t border-border mt-1 pt-1">
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Language
            </div>
            {languages.map((lang, index) => (
              <Link
                key={lang.code}
                href={pathname}
                locale={lang.code}
                onClick={() => setIsOpen(false)}
                onKeyDown={(e) => handleMenuKeyDown(e, themes.length + index, totalMenuItems)}
                className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted-background transition-colors focus:outline-none focus:bg-muted-background w-full text-left ${
                  locale === lang.code
                    ? 'bg-muted-background font-medium'
                    : ''
                }`}
                role="menuitem"
                aria-current={locale === lang.code ? 'page' : undefined}
              >
                <span className="text-base" aria-hidden="true">
                  {lang.code === 'en' ? '🇬🇧' : lang.code === 'nb' ? '🇳🇴' : '🇳🇴'}
                </span>
                <span>{lang.label}</span>
                {locale === lang.code && (
                  <span className="ml-auto text-primary" aria-hidden="true">✓</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}