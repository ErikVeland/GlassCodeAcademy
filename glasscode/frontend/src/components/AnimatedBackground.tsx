"use client";

import React, { useEffect, useRef, useCallback } from "react";

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
    "rgba(99, 102, 241, 0.12)", // indigo (blue) - .NET
    "rgba(168, 85, 247, 0.12)", // purple - GraphQL
    "rgba(236, 72, 153, 0.12)", // pink - Laravel
    "rgba(16, 185, 129, 0.12)", // green - React, Vue.js
    "rgba(245, 158, 11, 0.12)", // yellow - SASS
    "rgba(239, 68, 68, 0.12)", // red - Next.js
    "rgba(59, 130, 246, 0.12)", // blue - Node.js
    "rgba(139, 92, 246, 0.12)", // violet - Tailwind CSS
    "rgba(251, 146, 60, 0.12)", // orange - Testing & QA
    "rgba(14, 165, 233, 0.12)", // sky blue - TypeScript
    "rgba(192, 132, 252, 0.12)", // light purple - Databases
    "rgba(249, 115, 22, 0.12)", // orange-red - additional color for better transition
  ],
  speed = 45,
  blur = 55,
  opacity = 0.77,
  className = "",
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
    [onAnimationUpdate],
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
    [speed, isPaused, updateGradientPosition],
  );

  useEffect(() => {
    if (backgroundRef.current) {
      backgroundRef.current.style.background = `linear-gradient(
        45deg,
        ${colors.join(", ")}
      )`;
      backgroundRef.current.style.backgroundSize = "800% 800%";
      backgroundRef.current.style.filter = `blur(${blur}px)`;
      backgroundRef.current.style.willChange = "background-position";

      const targetOpacity = isPaused ? opacity * 0.2 : opacity;
      backgroundRef.current.style.opacity = `${targetOpacity}`;
      backgroundRef.current.style.transition = "opacity 0.3s ease-in-out";
    }
  }, [colors, blur, opacity, isPaused]);

  useEffect(() => {
    if (!backgroundRef.current) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
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
      ref={backgroundRef}
      className={`fixed top-0 left-0 w-full h-full -z-10 ${className}`}
      aria-hidden="true"
      role="presentation"
    />
  );
};

export default AnimatedBackground;
