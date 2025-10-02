'use client';

import React, { useEffect, useRef } from 'react';

interface AnimatedBackgroundProps {
  colors?: string[];
  speed?: number;
  blur?: number;
  opacity?: number;
  className?: string;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  colors = [
    'rgba(99, 102, 241, 0.12)',   // indigo (blue) - .NET
    'rgba(168, 85, 247, 0.12)',   // purple - GraphQL
    'rgba(236, 72, 153, 0.12)',   // pink - Laravel
    'rgba(16, 185, 129, 0.12)',   // green - React, Vue.js
    'rgba(245, 158, 11, 0.12)',   // yellow - SASS
    'rgba(239, 68, 68, 0.12)',    // red - Next.js
    'rgba(59, 130, 246, 0.12)',   // blue - Node.js
    'rgba(139, 92, 246, 0.12)',   // violet - Tailwind CSS
    'rgba(251, 146, 60, 0.12)',   // orange - Testing & QA
    'rgba(14, 165, 233, 0.12)',   // sky blue - TypeScript
    'rgba(192, 132, 252, 0.12)',  // light purple - Databases
    'rgba(249, 115, 22, 0.12)'    // orange-red - additional color for better transition
  ],
  speed = 45, // Increased from 25 to 45 seconds to fit all colors
  blur = 55,
  opacity = 0.77,
  className = ''
}) => {
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (backgroundRef.current) {
      const updateGradient = () => {
        if (backgroundRef.current) {
          backgroundRef.current.style.background = `linear-gradient(
            45deg,
            ${colors.join(', ')}
          )`;
          backgroundRef.current.style.backgroundSize = '800% 800%'; // Increased from 600% to 800% for smoother transitions
          
          // Check if user prefers reduced motion
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          
          // Only animate if user doesn't prefer reduced motion
          if (!prefersReducedMotion) {
            backgroundRef.current.style.animation = `gradientFlow ${speed}s ease infinite`;
          } else {
            // Apply a static gradient when reduced motion is preferred
            backgroundRef.current.style.animation = 'none';
          }
          
          backgroundRef.current.style.filter = `blur(${blur}px)`;
          backgroundRef.current.style.opacity = `${opacity}`;
        }
      };

      updateGradient();
    }
  }, [colors, speed, blur, opacity]);

  // Check if user prefers reduced motion
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <div 
      ref={backgroundRef}
      className={`fixed top-0 left-0 w-full h-full -z-10 ${className}`}
      style={{
        animation: prefersReducedMotion 
          ? 'none' 
          : `gradientFlow ${speed}s ease infinite`,
      }}
      aria-hidden="true"
      role="presentation"
    />
  );
};

export default AnimatedBackground;