'use client'

import { useDarkMode } from './DarkModeContext';
import { SunIcon, MoonIcon, ComputerDesktopIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/solid';

export default function DarkModeToggle() {
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
      className="p-2 rounded-full bg-surface-alt text-fg hover:bg-surface transition-colors duration-160 ease-out focus:outline-none focus:ring-2 ring-focus"
      aria-label={label}
      title={`${label} — click to cycle`}
    >
      {theme === 'system' ? (
        // Auto/system mode: phone icon on mobile, desktop icon on larger screens
        <span className="inline-flex">
          <DevicePhoneMobileIcon className="h-5 w-5 block sm:hidden" aria-hidden />
          <ComputerDesktopIcon className="h-5 w-5 hidden sm:block" aria-hidden />
        </span>
      ) : isDark ? (
        // Sun icon
        <SunIcon className="h-5 w-5" aria-hidden />
      ) : (
        // Moon icon
        <MoonIcon className="h-5 w-5" aria-hidden />
      )}
    </button>
  );
}