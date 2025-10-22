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
      className="fixed bottom-5 right-5 z-[1000] p-3 rounded-full shadow-lg bg-surface-alt text-fg hover:bg-surface transition-colors duration-160 ease-out focus:outline-none focus:ring-2 ring-focus"
    >
      {theme === 'system' ? (
        // System icon when in auto/system mode
        // Show phone icon on mobile viewports, desktop icon on larger screens
        <span className="inline-flex">
          <DevicePhoneMobileIcon className="h-5 w-5 block sm:hidden" aria-hidden />
          <ComputerDesktopIcon className="h-5 w-5 hidden sm:block" aria-hidden />
        </span>
      ) : isDark ? (
        // Sun icon when currently dark (click switches to light next)
        <SunIcon className="h-5 w-5" aria-hidden />
      ) : (
        // Moon icon when currently light (click switches to system next)
        <MoonIcon className="h-5 w-5" aria-hidden />
      )}
    </button>
  );
}