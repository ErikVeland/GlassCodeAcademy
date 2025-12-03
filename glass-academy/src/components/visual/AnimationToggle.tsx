'use client';

import { useUserAnimationPreference } from '@/hooks/useUserAnimationPreference';

export default function AnimationToggle() {
  const [enabled, setEnabled] = useUserAnimationPreference();

  return (
    <button
      onClick={() => setEnabled(!enabled)}
      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-foreground dark:hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
      aria-label={`Background animation is ${enabled ? 'on' : 'off'}. Click to turn ${enabled ? 'off' : 'on'}.`}
    >
      <span>Background Animation</span>
      <div
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
      <span className="sr-only">{enabled ? 'On' : 'Off'}</span>
    </button>
  );
}
