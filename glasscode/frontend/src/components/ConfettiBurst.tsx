"use client";

import { useEffect, useRef } from "react";

interface ConfettiBurstProps {
  active: boolean;
  durationMs?: number;
}

// Lightweight canvas confetti with no external dependencies
export default function ConfettiBurst({ active, durationMs = 4000 }: ConfettiBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const origin = { x: 0, y: 0 };
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      origin.x = canvas.width / 2;
      origin.y = canvas.height + 36; // just below bottom edge
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = [
      "#f87171", // red-400
      "#60a5fa", // blue-400
      "#34d399", // green-400
      "#fbbf24", // amber-400
      "#c084fc", // purple-400
      "#fb7185", // rose-400
    ];

    // Single-point fountain emitter: bottom-center, spreading upward with gravity
    const spread = 0.85; // radians around straight-up
    const minSpeed = 7.25;
    const maxSpeed = 12.0;

    const makePiece = () => {
      const theta = -Math.PI / 2 + (Math.random() - 0.5) * spread;
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
      return {
        x: origin.x,
        y: origin.y,
        w: 6 + Math.random() * 6,
        h: 10 + Math.random() * 10,
        vx: Math.cos(theta) * speed,
        vy: Math.sin(theta) * speed,
        rot: Math.random() * Math.PI,
        vrot: -0.15 + Math.random() * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 0.95,
      };
    };

    const pieces = Array.from({ length: 220 }).map(() => makePiece());

    const gravity = 0.13; // pull downward
    const drag = 0.989; // slight air resistance
    const emissionEndMs = durationMs * 0.65; // stop recycling after this
    const start = performance.now();
    startRef.current = start;

    const draw = () => {
      const now = performance.now();
      const elapsed = now - start;
      if (elapsed > durationMs) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        window.removeEventListener("resize", resize);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const wind = Math.sin(elapsed * 0.002) * 0.08;
      const fadeFactor = elapsed > emissionEndMs
        ? Math.max(0, (durationMs - elapsed) / (durationMs - emissionEndMs))
        : 1;
      for (const p of pieces) {
        // physics integration
        p.vy += gravity;
        p.vx += wind;
        p.vx *= drag;
        p.vy *= drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;

        // recycle when out of bounds (below screen or far off sides)
        const outOfBounds = p.y > canvas.height + 80 || p.x < -80 || p.x > canvas.width + 80;
        if (outOfBounds) {
          if (elapsed <= emissionEndMs) {
            const theta = -Math.PI / 2 + (Math.random() - 0.5) * spread;
            const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
            p.x = origin.x;
            p.y = origin.y;
            p.vx = Math.cos(theta) * speed;
            p.vy = Math.sin(theta) * speed;
            p.rot = Math.random() * Math.PI;
            p.vrot = -0.15 + Math.random() * 0.3;
            p.opacity = 0.95;
          } else {
            p.opacity = 0;
            continue;
          }
        }

        // draw
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity * fadeFactor;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [active, durationMs]);

  return (
    <div className={`pointer-events-none fixed inset-0 z-40 ${active ? '' : 'hidden'}`}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}