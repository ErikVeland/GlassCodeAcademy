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
    "rgba(99, 102, 241, 0.12)",   // indigo
    "rgba(168, 85, 247, 0.12)",   // purple
    "rgba(236, 72, 153, 0.12)",   // pink
    "rgba(16, 185, 129, 0.12)",   // green
    "rgba(245, 158, 11, 0.12)",   // yellow
    "rgba(239, 68, 68, 0.12)"     // red
  ],
  speed: 25,
  blur: 55,
  opacity: 0.77,
  respectReducedMotion: false
};

export default function GlobalAnimatedBackground() {
  const [settings, setSettings] = useState<BackgroundSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

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
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Don't render until we've checked localStorage to avoid hydration mismatch
  if (!isLoaded) {
    return null;
  }

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