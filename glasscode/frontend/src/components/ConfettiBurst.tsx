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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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

    const pieces = Array.from({ length: 160 }).map(() => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      w: 6 + Math.random() * 6,
      h: 10 + Math.random() * 10,
      vx: -2 + Math.random() * 4,
      vy: 2 + Math.random() * 2,
      rot: Math.random() * Math.PI,
      vrot: (-0.1 + Math.random() * 0.2),
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.9,
    }));

    const gravity = 0.08;
    const drag = 0.997;
    const start = performance.now();

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
      for (const p of pieces) {
        p.vy += gravity;
        p.vx *= drag;
        p.vy *= drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        if (p.y > canvas.height + 20) {
          p.y = -20 - Math.random() * 100;
          p.x = Math.random() * canvas.width;
          p.vy = 2 + Math.random() * 2;
          p.vx = -2 + Math.random() * 4;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
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