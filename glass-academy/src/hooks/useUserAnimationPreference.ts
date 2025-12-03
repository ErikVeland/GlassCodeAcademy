'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to manage user animation preference with localStorage
 * @returns [enabled, setEnabled] - Current state and setter
 */
export function useUserAnimationPreference(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('backgroundAnimation');
    return stored !== 'off';
  });

  useEffect(() => {
    localStorage.setItem('backgroundAnimation', enabled ? 'on' : 'off');
  }, [enabled]);

  return [enabled, setEnabled];
}
