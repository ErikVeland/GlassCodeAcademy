"use client";

import React, { Suspense, useEffect, useRef } from "react";
import Link from "next/link";

function NotFoundArt() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="parallax-layer absolute -top-10 -left-10 w-64 h-64 rounded-full bg-gradient-to-br from-pink-400/40 to-violet-500/40 blur-3xl animate-[drift_18s_ease-in-out_infinite]"
        style={{ transform: "translate3d(calc(var(--mx) * 0.06px), calc(var(--my) * 0.04px), 0)" }}
      />
      <div
        className="parallax-layer absolute top-20 -right-12 w-72 h-72 rounded-full bg-gradient-to-br from-cyan-400/40 to-blue-500/40 blur-3xl animate-[drift_16s_ease-in-out_infinite]"
        style={{ transform: "translate3d(calc(var(--mx) * -0.05px), calc(var(--my) * 0.03px), 0)" }}
      />
      <div
        className="parallax-layer absolute bottom-10 left-1/3 w-56 h-56 rounded-full bg-gradient-to-br from-amber-300/40 to-rose-400/40 blur-2xl animate-[drift_20s_ease-in-out_infinite]"
        style={{ transform: "translate3d(calc(var(--mx) * 0.03px), calc(var(--my) * -0.05px), 0)" }}
      />

      {/* Floating bubbles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="absolute inline-block rounded-full bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30"
          style={{
            width: `${18 + (i % 6) * 6}px`,
            height: `${18 + (i % 5) * 7}px`,
            left: `${(i * 8) % 100}%`,
            top: `${(i * 11) % 100}%`,
            animation: `float ${8 + (i % 5) * 2}s ease-in-out ${i * 0.3}s infinite`,
          }}
        />
      ))}

      {/* Playful compass */}
      <div className="parallax-layer absolute right-6 bottom-8 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/40 to-fuchsia-500/40 border border-white/30 backdrop-blur-md grid place-items-center animate-[spin_36s_linear_infinite]"
           style={{ transform: "translate3d(calc(var(--mx) * -0.02px), calc(var(--my) * -0.02px), 0)" }}>
        <span className="text-2xl">🧭</span>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.9; }
          50% { transform: translateY(-12px) translateX(6px); opacity: 0.6; }
        }
        @keyframes drift {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(12px, -10px) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 92%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes wag {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(6deg); }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .parallax-layer {
            animation: none !important;
            transform: none !important;
          }
          .animate-[spin_36s_linear_infinite], .animate-[drift_18s_ease-in-out_infinite], .animate-[drift_16s_ease-in-out_infinite], .animate-[drift_20s_ease-in-out_infinite] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function GlassFoxMascot() {
  return (
    <div className="relative mx-auto w-[220px] h-[220px] mb-8 select-none">
      <svg viewBox="0 0 220 220" className="w-full h-full drop-shadow-xl">
        <defs>
          <linearGradient id="g-body" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#fb7185" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="g-shine" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Body */}
        <g className="[animation:bob_4s_ease-in-out_infinite]">
          <circle cx="110" cy="110" r="70" fill="url(#g-body)" opacity="0.85" />
          <rect x="60" y="55" width="100" height="50" rx="18" ry="18" fill="#ffffff" opacity="0.15" />
          <rect x="55" y="130" width="110" height="45" rx="22" ry="22" fill="#ffffff" opacity="0.1" />

          {/* Ears */}
          <path d="M70 70 L88 40 L96 74 Z" fill="#f0abfc" opacity="0.8" />
          <path d="M150 70 L132 40 L124 74 Z" fill="#f0abfc" opacity="0.8" />

          {/* Eyes */}
          <g transform="translate(85,100)">
            <rect x="0" y="0" width="20" height="12" rx="6" fill="#111827" className="[animation:blink_4.5s_ease-in-out_infinite]" />
          </g>
          <g transform="translate(125,100)">
            <rect x="0" y="0" width="20" height="12" rx="6" fill="#111827" className="[animation:blink_5.2s_ease-in-out_infinite]" />
          </g>

          {/* Smile */}
          <path d="M90 125 Q110 140 130 125" stroke="#111827" strokeWidth="3" fill="none" opacity="0.9" />

          {/* Tail */}
          <path d="M45 130 C30 120, 30 160, 55 170 C70 176, 82 168, 85 158" stroke="#fb7185" strokeWidth="8" fill="none" className="origin-[55px_170px] [animation:wag_3.6s_ease-in-out_infinite]" />

          {/* Wand */}
          <g className="origin-[165px_155px] [animation:wag_3s_ease-in-out_infinite]">
            <rect x="160" y="130" width="8" height="40" rx="4" fill="#22d3ee" />
            <circle cx="164" cy="128" r="10" fill="#a78bfa" />
            <text x="155" y="160" fontSize="18">✨</text>
          </g>

          {/* Shine */}
          <path d="M70 95 C90 60, 120 60, 140 95" stroke="url(#g-shine)" strokeWidth="8" opacity="0.5" />
        </g>
      </svg>
    </div>
  );
}

function NotFoundContent() {
  const parallaxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = parallaxRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return; // respect reduced motion
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const mx = (e.clientX - cx) / (window.innerWidth / 2) * 100;
      const my = (e.clientY - cy) / (window.innerHeight / 2) * 100;
      el.style.setProperty("--mx", String(mx));
      el.style.setProperty("--my", String(my));
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <div ref={parallaxRef} className="relative py-20 px-4 sm:px-6 lg:px-8">
      <NotFoundArt />
      <div className="max-w-3xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl border border-white/30 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-2xl">
          {/* Sparkle top border */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pink-400 via-fuchsia-500 to-indigo-500 opacity-70" />

          <div className="relative p-10 text-center">
            <h1
              className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-500 bg-clip-text text-transparent"
            >
              Lost in the Glassverse
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
              This page drifted off into the ether. Let’s guide you home ✨
            </p>

            {/* Mascot */}
            <div className="flex justify-center">
              <GlassFoxMascot />
            </div>

            {/* Whimsical icon row */}
            <div className="flex items-center justify-center gap-5 mb-8">
              <span className="text-2xl animate-bounce">🪄</span>
              <span className="text-2xl animate-pulse">🫧</span>
              <span className="text-2xl animate-bounce">🧪</span>
              <span className="text-2xl animate-pulse">🧩</span>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow hover:from-indigo-500 hover:to-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <span>Go Home</span>
                <span>🏠</span>
              </Link>
              <Link
                href="/programming"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 bg-white/80 dark:bg-gray-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <span>Explore Programming</span>
                <span>💻</span>
              </Link>
              <Link
                href="/playground"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 bg-white/80 dark:bg-gray-900/60 text-pink-700 dark:text-pink-300 border border-pink-200/60 hover:bg-white focus:outline-none focus:ring-2 focus:ring-pink-300"
              >
                <span>Open Playground</span>
                <span>🎨</span>
              </Link>
              <Link
                href="/interview-prep"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 bg-white/80 dark:bg-gray-900/60 text-violet-700 dark:text-violet-300 border border-violet-200/60 hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
              >
                <span>Interview Prep</span>
                <span>🧠</span>
              </Link>
            </div>

            {/* Helpful tip */}
            <div className="mt-10 text-sm text-gray-600 dark:text-gray-400">
              Pro tip: Try the <code className="px-2 py-1 rounded bg-black/10 dark:bg-white/10">/?unlock</code> magic on the homepage.
            </div>
          </div>

          {/* Sparkle bottom border */}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 opacity-70" />
        </div>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense
      fallback={
        <div className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Loading whimsical vibes…</h2>
              <p className="text-gray-600 dark:text-gray-300">Summoning sparkles and gradients ✨</p>
            </div>
          </div>
        </div>
      }
    >
      <NotFoundContent />
    </Suspense>
  );
}