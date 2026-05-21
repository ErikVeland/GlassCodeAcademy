'use client';

import React, { useEffect, useState } from 'react';
import AnimatedBackground from './AnimatedBackground';

interface BackgroundSettings {
  colors: string[];
  speed: number;
  blur: number;
  opacity: number;
  respectReducedMotion: boolean;
}

const defaultSettings: BackgroundSettings = {
  colors: [
    'rgba(49, 120, 198, 0.14)',
    'rgba(19, 143, 138, 0.12)',
    'rgba(110, 69, 216, 0.13)',
    'rgba(27, 158, 175, 0.1)',
    'rgba(17, 24, 39, 0.08)',
  ],
  speed: 34,
  blur: 48,
  opacity: 0.72,
  respectReducedMotion: false,
};

export default function GlobalAnimatedBackground() {
  const [settings, setSettings] = useState<BackgroundSettings>(defaultSettings);

  useEffect(() => {
    // Load saved settings from localStorage
    try {
      const savedSettings = localStorage.getItem('appBackgroundSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      }
    } catch (error) {
      console.error('Failed to load background settings:', error);
    }
  }, []);

  // Always render the background - start with defaults, then update with saved settings
  // This ensures there's always a background visible

  return (
    <AnimatedBackground
      colors={settings.colors}
      speed={settings.speed}
      blur={settings.blur}
      opacity={settings.opacity}
      respectReducedMotion={settings.respectReducedMotion}
      isPaused={false}
    />
  );
}
