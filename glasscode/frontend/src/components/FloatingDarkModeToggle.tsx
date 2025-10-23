'use client'

import { useDarkMode } from './DarkModeContext';
import { SunIcon, MoonIcon, ComputerDesktopIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/solid';

export default function FloatingDarkModeToggle() {
  const { theme, isDark, cycleTheme } = useDarkMode();

  const label =
    theme === 'system'
      ? 'Theme: System (auto)'
      : theme === 'dark'
      ? 'Theme: Dark'
      : 'Theme: Light';

  return (
    <button
      onClick={cycleTheme}
      aria-label={label}
      title={`${label} — click to cycle`}
      data-testid="theme-toggle"
      className="fixed bottom-5 right-5 z-[1000] rounded-full shadow-lg bg-surface-alt text-fg hover:bg-surface transition-colors duration-160 ease-out focus:outline-none focus:ring-2 ring-focus w-12 h-12 inline-flex items-center justify-center"
    >
      {theme === 'system' ? (
        // System icon when in auto/system mode
        // Show phone icon on mobile viewports, desktop icon on larger screens
        <span className="inline-flex items-center justify-center leading-none align-middle">
          <DevicePhoneMobileIcon className="h-6 w-6 block sm:hidden shrink-0" aria-hidden />
          <ComputerDesktopIcon className="h-6 w-6 hidden sm:block shrink-0" aria-hidden />
        </span>
      ) : isDark ? (
        // Sun icon when currently dark (click switches to light next)
        <SunIcon className="h-6 w-6 block shrink-0" aria-hidden />
      ) : (
        // Moon icon when currently light (click switches to system next)
        <MoonIcon className="h-6 w-6 block shrink-0" aria-hidden />
      )}
    </button>
  );
}