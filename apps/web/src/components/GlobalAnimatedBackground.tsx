"use client";

import React, { useEffect, useState } from "react";
import AnimatedBackground from "./AnimatedBackground";

interface BackgroundSettings {
  colors: string[];
  speed: number;
  blur: number;
  opacity: number;
  respectReducedMotion: boolean;
}

const defaultSettings: BackgroundSettings = {
  colors: [
    "rgba(99, 102, 241, 0.15)", // indigo - slightly more visible
    "rgba(168, 85, 247, 0.15)", // purple
    "rgba(236, 72, 153, 0.15)", // pink
    "rgba(16, 185, 129, 0.15)", // green
    "rgba(245, 158, 11, 0.15)", // yellow
    "rgba(239, 68, 68, 0.15)", // red
  ],
  speed: 25,
  blur: 55,
  opacity: 0.8, // slightly more opaque
  respectReducedMotion: false,
};

export default function GlobalAnimatedBackground() {
  const [settings, setSettings] = useState<BackgroundSettings>(defaultSettings);

  useEffect(() => {
    // Load saved settings from localStorage
    try {
      const savedSettings = localStorage.getItem("appBackgroundSettings");
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      }
    } catch (error) {
      console.error("Failed to load background settings:", error);
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
