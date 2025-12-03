'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project, Locale } from '@/lib/projects';
import { getProjectScreenshots } from '@/lib/projects';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface ProjectHeroCarouselProps {
  project: Project;
  locale: Locale;
}

export default function ProjectHeroCarousel({ project, locale }: ProjectHeroCarouselProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const heroImage = getProjectScreenshots(project, 'hero') as string;
  const detailImages = getProjectScreenshots(project, 'details') as string[];
  
  // Combine hero (shown for longer) with detail images
  const allImages = [heroImage, ...detailImages];
  
  // Hero image gets double the time
  const getIntervalForIndex = (index: number) => {
    return index === 0 ? 8000 : 4000; // 8s for hero, 4s for details
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % allImages.length);
  }, [allImages.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  // Auto-advance with different timing for hero vs details
  useEffect(() => {
    if (prefersReducedMotion || isHovered || isFocused || allImages.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      goToNext();
    }, getIntervalForIndex(currentIndex));

    return () => clearInterval(interval);
  }, [currentIndex, prefersReducedMotion, isHovered, isFocused, allImages.length, goToNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFocused) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, goToNext, goToPrevious]);

  const currentImage = allImages[currentIndex];
  const isHeroSlide = currentIndex === 0;

  return (
    <section 
      className="mb-12"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      aria-label={`${project.title[locale]} screenshots`}
    >
      {/* Main Image Display */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-2xl">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentIndex}
            initial={prefersReducedMotion ? {} : { opacity: 0, scale: 1.05 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.7,
              ease: [0.4, 0, 0.2, 1]
            }}
            className="absolute inset-0"
          >
            <Image
              src={currentImage}
              alt={isHeroSlide 
                ? `${project.title[locale]} - Hero screenshot`
                : `${project.title[locale]} - Detail screenshot ${currentIndex}`
              }
              fill
              priority={currentIndex === 0}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
            />
          </motion.div>
        </AnimatePresence>

        {/* Gradient overlay for better control visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

        {/* Navigation Controls */}
        {allImages.length > 1 && (
          <>
            {/* Previous Button */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50"
              aria-label="Previous screenshot"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* Next Button */}
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50"
              aria-label="Next screenshot"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {/* Slide Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50 rounded-full ${
                    index === currentIndex
                      ? 'w-8 h-2 bg-white'
                      : 'w-2 h-2 bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={
                    index === 0
                      ? 'Go to hero screenshot'
                      : `Go to detail screenshot ${index}`
                  }
                  aria-current={index === currentIndex ? 'true' : 'false'}
                />
              ))}
            </div>

            {/* Badge showing if it's the hero or detail */}
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
              {isHeroSlide ? 'Hero' : `Detail ${currentIndex}`}
            </div>
          </>
        )}
      </div>

      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isHeroSlide 
          ? `Showing hero screenshot of ${project.title[locale]}`
          : `Showing detail screenshot ${currentIndex} of ${allImages.length - 1} for ${project.title[locale]}`
        }
      </div>
    </section>
  );
}
