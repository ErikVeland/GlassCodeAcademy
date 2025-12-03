'use client';

import { useEffect, useState, useRef } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useUserAnimationPreference } from '@/hooks/useUserAnimationPreference';
import { useTheme } from '@/contexts/ThemeContext';

// Dynamic import for three.js to avoid SSR issues
interface NetworkSceneProps {
  theme: 'light' | 'dark';
}

const NetworkScene = ({ theme }: NetworkSceneProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let animationFrameId: number;
    const particles: Array<{ x: number; y: number; vx: number; vy: number }> = [];
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const particleCount = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000));
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      });
    }

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Theme-aware colors
      const particleColor = theme === 'dark' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(37, 99, 235, 0.3)';
      const connectionBaseColor = theme === 'dark' ? 'rgba(59, 130, 246,' : 'rgba(37, 99, 235,';

      // Update and draw particles
      particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.fillStyle = particleColor;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw connections to nearby particles
        particles.slice(i + 1).forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            const opacity = 0.15 * (1 - distance / 150);
            ctx.strokeStyle = `${connectionBaseColor} ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
          }
        });
      });

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

export default function WebGLBackground() {
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
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background to-background-elevated" />
    );
  }

  // Show static gradient if motion is reduced, on mobile, or user disabled
  const shouldShowStatic = prefersReducedMotion || isMobile || !userPreference;

  if (shouldShowStatic) {
    return (
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background to-background-elevated" />
    );
  }

  // Render WebGL background
  return (
    <div className="fixed inset-0 -z-10 bg-background" aria-hidden="true">
      <NetworkScene theme={resolvedTheme} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />
    </div>
  );
}
