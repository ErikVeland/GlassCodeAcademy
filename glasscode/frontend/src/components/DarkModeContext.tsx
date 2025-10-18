'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

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
      // Optionally clear legacy key
      localStorage.removeItem('darkMode');
    } catch {
      // ignore storage errors
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
    setTheme((prev) => (prev === 'system' ? 'dark' : prev === 'dark' ? 'light' : 'system'));
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