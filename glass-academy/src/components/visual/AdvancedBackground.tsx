'use client';

import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useUserAnimationPreference } from '@/hooks/useUserAnimationPreference';
import { useTheme } from '@/contexts/ThemeContext';

interface FluidSimulationProps {
  theme: 'light' | 'dark';
}

const FluidSimulation = ({ theme }: FluidSimulationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let animationFrameId: number;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Metaballs simulation for organic fluid effect
    interface Metaball {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }

    const metaballs: Metaball[] = [];

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize metaballs
    const ballCount = Math.min(12, Math.floor((canvas.width * canvas.height) / 100000));
    for (let i = 0; i < ballCount; i++) {
      metaballs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 80 + 60,
      });
    }

    // Theme-aware colors
    const getColors = () => {
      if (theme === 'dark') {
        return {
          primary: 'rgba(129, 140, 248, 0.4)', // Indigo 400
          secondary: 'rgba(167, 139, 250, 0.3)', // Violet 400
          accent: 'rgba(244, 114, 182, 0.2)', // Pink 400
        };
      }
      return {
        primary: 'rgba(99, 102, 241, 0.3)', // Indigo 500
        secondary: 'rgba(139, 92, 246, 0.25)', // Violet 500
        accent: 'rgba(236, 72, 153, 0.15)', // Pink 500
      };
    };

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear canvas with fade effect
      ctx.fillStyle = theme === 'dark' ? 'rgba(10, 10, 10, 0.05)' : 'rgba(250, 250, 250, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const colors = getColors();

      // Update and draw metaballs
      metaballs.forEach((ball, i) => {
        // Update position
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Bounce off edges with smooth dampening
        if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
          ball.vx *= -0.95;
          ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x));
        }
        if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
          ball.vy *= -0.95;
          ball.y = Math.max(ball.radius, Math.min(canvas.height - ball.radius, ball.y));
        }

        // Create radial gradient for each ball
        const gradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius);
        const color = i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.secondary : colors.accent;
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');

        // Draw metaball
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw connections between nearby balls
        metaballs.slice(i + 1).forEach((otherBall) => {
          const dx = ball.x - otherBall.x;
          const dy = ball.y - otherBall.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 250) {
            const opacity = (1 - distance / 250) * 0.1;
            const connectionGradient = ctx.createLinearGradient(
              ball.x,
              ball.y,
              otherBall.x,
              otherBall.y
            );
            connectionGradient.addColorStop(0, color);
            connectionGradient.addColorStop(1, colors.secondary);

            ctx.strokeStyle = connectionGradient;
            ctx.globalAlpha = opacity;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(ball.x, ball.y);
            ctx.lineTo(otherBall.x, otherBall.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        });
      });

      // Add subtle noise overlay
      if (Math.random() > 0.95) {
        const noiseX = Math.random() * canvas.width;
        const noiseY = Math.random() * canvas.height;
        ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)';
        ctx.fillRect(noiseX, noiseY, 2, 2);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
};

export default function AdvancedBackground() {
  const { resolvedTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });
  const prefersReducedMotion = usePrefersReducedMotion();
  const [userPreference] = useUserAnimationPreference();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Server-side: render gradient fallback
  if (typeof window === 'undefined') {
    return (
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 bg-gradient-subtle opacity-50" />
      </div>
    );
  }

  // Show static gradient if motion is reduced, on mobile, or user disabled
  const shouldShowStatic = prefersReducedMotion || isMobile || !userPreference;

  if (shouldShowStatic) {
    return (
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 bg-gradient-subtle opacity-50" />
      </div>
    );
  }

  // Render advanced fluid simulation
  return (
    <div className="fixed inset-0 -z-10 bg-background" aria-hidden="true">
      <FluidSimulation theme={resolvedTheme} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background pointer-events-none" />
    </div>
  );
}
