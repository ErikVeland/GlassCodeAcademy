'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useState, useRef, useEffect } from 'react';

const themes = [
  { value: 'light' as const, label: 'Light', icon: '☀️' },
  { value: 'dark' as const, label: 'Dark', icon: '🌙' },
  { value: 'auto' as const, label: 'System', icon: '💻' },
];

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentTheme = themes.find(t => t.value === theme);

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

  const handleMenuKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % themes.length;
      const nextButton = menuRef.current?.querySelectorAll('button')[nextIndex];
      (nextButton as HTMLButtonElement)?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = index === 0 ? themes.length - 1 : index - 1;
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

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
        aria-label={`Current theme: ${currentTheme?.label}. Click to change theme.`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="text-base" aria-hidden="true">{currentTheme?.icon}</span>
        <span className="hidden sm:inline">{currentTheme?.label}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-36 bg-background border border-border rounded-md shadow-lg z-50"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="theme-menu"
        >
          {themes.map((t, index) => (
            <button
              key={t.value}
              onClick={() => handleThemeSelect(t.value)}
              onKeyDown={(e) => handleMenuKeyDown(e, index)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-muted-background transition-colors focus:outline-none focus:bg-muted-background ${
                theme === t.value ? 'bg-muted-background font-medium' : ''
              } ${index === 0 ? 'rounded-t-md' : ''} ${index === themes.length - 1 ? 'rounded-b-md' : ''}`}
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
        </div>
      )}
    </div>
  );
}
