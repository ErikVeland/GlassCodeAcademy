"use client";

import React, { useEffect, useState } from "react";
import ConfettiBurst from "./ConfettiBurst";
import { useProfile } from "./ProfileProvider";

type CertificateAwardProps = {
  moduleName: string;
  score: number;
  total: number;
  percent: number;
  className?: string;
};

const CertificateAward: React.FC<CertificateAwardProps> = ({
  moduleName,
  score,
  total,
  percent,
  className = "",
}) => {
  const { profile } = useProfile();
  const isHighDistinction = percent === 100;
  const [showLightning, setShowLightning] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  // Stable certificate ID for the lifetime of this component mount
  const [certificateId] = useState<string>(() => {
    const randomSix = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, "0");
    return `GC-${randomSix}`;
  });

  // Trigger lightning on first mount for High Distinction
  useEffect(() => {
    if (isHighDistinction) {
      // Start lightning effect on appearance
      if (!isReducedMotion) {
        setShowLightning(true);
        // Optionally fade the intense crackle after a short burst
        const t = setTimeout(() => setShowLightning(false), 3500);
        return () => clearTimeout(t);
      } else {
        setShowLightning(false);
      }
    }
  }, [isHighDistinction, isReducedMotion]);

  // Respect system reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePref = () => setIsReducedMotion(mq.matches);
    updatePref();
    mq.addEventListener?.('change', updatePref);
    return () => mq.removeEventListener?.('change', updatePref);
  }, []);

  return (
    <div className={`relative mx-auto max-w-2xl ${className}`}>
      {/* Only celebrate with confetti for High Distinction (disabled if reduced motion) */}
      <ConfettiBurst active={isHighDistinction && !isReducedMotion} durationMs={6000} />

      <div className={`relative rounded-2xl p-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950/40 dark:via-gray-900 dark:to-indigo-900/40 border-4 border-blue-200 dark:border-blue-700 shadow-xl ${isHighDistinction && showLightning ? 'badge-hd-award' : ''}`}>
        {/* Decorative corner seals */}
        <div className="absolute -top-3 -left-3 h-12 w-12 rounded-full border-4 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-900" />
        <div className="absolute -top-3 -right-3 h-12 w-12 rounded-full border-4 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-900" />
        <div className="absolute -bottom-3 -left-3 h-12 w-12 rounded-full border-4 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-900" />
        <div className="absolute -bottom-3 -right-3 h-12 w-12 rounded-full border-4 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-900" />

        {/* Animated sheen for High Distinction */}
        {isHighDistinction && !isReducedMotion && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute -top-1/2 -left-1/2 h-[200%] w-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2.5s_infinite]" />
          </div>
        )}

        {/* Title */}
        <h3 className="text-2xl font-extrabold tracking-wide text-blue-800 dark:text-blue-200 mb-3">
          Certificate of Achievement
        </h3>
        <p className="text-sm uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-6">
          Presented by GlassCode Academy
        </p>

        {/* Recipient and details */}
        <div className="space-y-2 text-center">
          <p className="text-gray-800 dark:text-gray-200 text-lg">This certifies that</p>
          <p className="text-2xl font-semibold text-blue-700 dark:text-blue-300 certificate-name">
            {profile.displayName || "You"}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            successfully completed the {moduleName} Interview Preparation Quiz
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            with a score of <span className="font-semibold">{score}/{total}</span> ({percent}%).
          </p>
          {isHighDistinction && (
            <p className="mt-2 text-amber-600 dark:text-amber-400 font-semibold">
              High Distinction — Perfect Score!
            </p>
          )}
        </div>

        {/* Seal */}
        <div className="mt-8 flex items-center justify-center gap-6">
          <div className={`h-20 w-20 rounded-full shadow-lg border-4 flex items-center justify-center ${
            isHighDistinction
              ? "bg-gradient-to-br from-emerald-400 to-green-600 border-green-300 dark:from-emerald-500 dark:to-green-700 dark:border-green-800"
              : "bg-gradient-to-br from-green-400 to-emerald-500 border-green-200 dark:from-green-500 dark:to-emerald-600 dark:border-emerald-700"
          }`}>
            <span className="text-white font-bold">
              {isHighDistinction ? "HD" : "PASS"}
            </span>
          </div>
          <div className="text-left">
            <p className="text-sm text-gray-600 dark:text-gray-400">Issued on {new Date().toLocaleDateString()}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Certificate ID: {certificateId}</p>
          </div>
        </div>

        {/* Signature line */}
        <div className="mt-8 border-t border-dashed border-gray-300 dark:border-gray-700 pt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Authorized by GlassCode Academy</p>
        </div>
      </div>
    </div>
  );
};

export default CertificateAward;

/*
Tailwind keyframes for shimmer (added via utility if configured):
@keyframes shimmer { 0% { transform: translateX(-50%); } 100% { transform: translateX(150%); } }
*/