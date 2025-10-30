'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

type Theme = 'light' | 'dark' | 'system';

declare global {
  interface Window {
    __gcPendingTheme?: Theme;
    __gcRemovePreHydrationToggle?: () => void;
  }
}

type DarkModeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  isDark: boolean;
};

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [isDark, setIsDark] = useState<boolean>(false);
  const firstApplyRef = useRef(true);

  // Read saved preference on mount, with fallback for legacy 'darkMode' key
  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setTheme(saved as Theme);
        return;
      }
      const legacy = localStorage.getItem('darkMode');
      if (legacy === 'true') {
        setTheme('dark');
      } else if (legacy === 'false') {
        setTheme('light');
      }
    } catch {
      // ignore storage errors
    }
  }, []);


  // Bridge pre-hydration theme selections into React state
  useEffect(() => {
    try {
      const pending = window.__gcPendingTheme;
      if (pending === 'light' || pending === 'dark' || pending === 'system') {
        setTheme(pending);
        try { delete window.__gcPendingTheme; } catch {}
      }
    } catch {}

    type ThemeChangeDetail = { theme: Theme };
    const handler = (e: Event) => {
      try {
        const ce = e as CustomEvent<ThemeChangeDetail>;
        const t = ce.detail?.theme;
        if (t === 'light' || t === 'dark' || t === 'system') {
          setTheme(t);
        }
      } catch {}
    };
    window.addEventListener('gc-theme-change', handler);
    return () => {
      window.removeEventListener('gc-theme-change', handler);
    };
  }, []);

  // Apply theme to document and persist selection
  useEffect(() => {
    const html = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const activeDark = theme === 'dark' || (theme === 'system' && prefersDark);

    setIsDark(activeDark);

    if (activeDark) {
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      html.style.colorScheme = 'light';
    }
    html.setAttribute('data-theme', theme === 'system' ? (activeDark ? 'dark' : 'light') : theme);

    try {
      localStorage.setItem('theme', theme);
      localStorage.removeItem('darkMode');
    } catch {
      // ignore storage errors
    }

    // Sync SSR cookie with resolved theme
    try {
      const resolved = theme === 'system' ? (activeDark ? 'dark' : 'light') : theme;
      document.cookie = `gc-theme=${resolved}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // ignore cookie errors
    }

    // Smooth fade on explicit theme changes (skip first paint)
    if (firstApplyRef.current) {
      firstApplyRef.current = false;
    } else {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduceMotion) {
        html.classList.add('theme-transition');
        window.setTimeout(() => html.classList.remove('theme-transition'), 220);
      }
    }
  }, [theme]);

  // Keep in sync with system preference when in system mode
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') {
        const activeDark = mql.matches;
        setIsDark(activeDark);
        const html = document.documentElement;
        if (activeDark) {
          html.classList.add('dark');
          html.style.colorScheme = 'dark';
        } else {
          html.classList.remove('dark');
          html.style.colorScheme = 'light';
        }
        html.setAttribute('data-theme', activeDark ? 'dark' : 'light');

        // Smooth fade when OS theme changes in system mode
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduceMotion) {
          html.classList.add('theme-transition');
          window.setTimeout(() => html.classList.remove('theme-transition'), 220);
        }
      }
    };

    if (theme === 'system') {
      mql.addEventListener('change', handler);
    }
    return () => {
      mql.removeEventListener('change', handler);
    };
  }, [theme]);

  const cycleTheme = () => {
    setTheme((prev) => {
      if (prev === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'light' : 'dark';
      }
      if (prev === 'dark') return 'light';
      return 'system';
    });
  };

  return (
    <DarkModeContext.Provider value={{ theme, setTheme, cycleTheme, isDark }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
}