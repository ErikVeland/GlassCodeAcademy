'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface AnimatedBackgroundProps {
  colors?: string[];
  speed?: number;
  blur?: number;
  opacity?: number;
  className?: string;
  respectReducedMotion?: boolean;
  isPaused?: boolean;
  onAnimationUpdate?: (currentPosition: number) => void;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  colors = [
    'rgba(49, 120, 198, 0.12)',
    'rgba(19, 143, 138, 0.1)',
    'rgba(110, 69, 216, 0.11)',
    'rgba(27, 158, 175, 0.1)',
    'rgba(17, 24, 39, 0.07)',
  ],
  speed = 45,
  blur = 55,
  opacity = 0.77,
  className = '',
  respectReducedMotion = true,
  isPaused = false,
  onAnimationUpdate,
}) => {
  const backgroundRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const updateGradientPosition = useCallback(
    (position: number) => {
      if (backgroundRef.current) {
        const backgroundPosition = `${position}% ${100 - position}%`;
        backgroundRef.current.style.backgroundPosition = backgroundPosition;
        onAnimationUpdate?.(position);
      }
    },
    [onAnimationUpdate]
  );

  const animate = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp - pausedTimeRef.current;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = (elapsed / (speed * 1000)) % 1;

      // Triangle wave (ping-pong) for seamless looping
      const pingPong = progress < 0.5 ? progress * 2 : (1 - progress) * 2; // 0->1->0

      // Ease in-out for smoother motion
      const eased = 0.5 - 0.5 * Math.cos(pingPong * Math.PI);

      const position = eased * 100;

      updateGradientPosition(position);

      if (!isPaused) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        pausedTimeRef.current = elapsed;
      }
    },
    [speed, isPaused, updateGradientPosition]
  );

  useEffect(() => {
    if (backgroundRef.current) {
      backgroundRef.current.style.background = `linear-gradient(
        45deg,
        ${colors.join(', ')}
      )`;
      backgroundRef.current.style.backgroundSize = '800% 800%';
      backgroundRef.current.style.filter = `blur(${blur}px)`;
      backgroundRef.current.style.willChange = 'background-position';

      const targetOpacity = isPaused ? opacity * 0.2 : opacity;
      backgroundRef.current.style.opacity = `${targetOpacity}`;
      backgroundRef.current.style.transition = 'opacity 0.3s ease-in-out';
    }
  }, [colors, blur, opacity, isPaused]);

  useEffect(() => {
    if (!backgroundRef.current) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (respectReducedMotion && prefersReducedMotion) {
      // Static gradient when reduced motion is preferred
      updateGradientPosition(0);
      return;
    }

    // Start or stop animation based on isPaused
    if (!isPaused) {
      startTimeRef.current = 0; // Reset start time
      pausedTimeRef.current = 0; // Reset paused time
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = 0;
      }
    }

    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = 0;
      }
    };
  }, [animate, isPaused, respectReducedMotion, updateGradientPosition]);

  return (
    <div
      className={`gc-ambient-background pointer-events-none fixed inset-0 z-0 w-full h-full ${className}`}
      aria-hidden="true"
      role="presentation"
    >
      <div ref={backgroundRef} className="gc-ambient-gradient" />
      <div className="gc-ambient-lattice" />
      <div className="gc-ambient-scanline" />
    </div>
  );
};

export default AnimatedBackground;
