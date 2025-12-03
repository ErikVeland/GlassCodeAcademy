'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import type { Project, Locale } from '@/lib/projects';
import { getProjectScreenshots } from '@/lib/projects';
import Tag from '@/components/ui/Tag';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface HeroProjectCarouselProps {
  projects: Project[];
  locale: Locale;
}

export default function HeroProjectCarousel({ projects, locale }: HeroProjectCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentProject = projects[currentIndex];
  const heroImage = getProjectScreenshots(currentProject, 'hero') as string;

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % projects.length);
  }, [projects.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + projects.length) % projects.length);
  }, [projects.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Autoplay logic
  useEffect(() => {
    // Don't autoplay if reduced motion is preferred or if carousel is paused
    if (prefersReducedMotion || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(goToNext, 7000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [goToNext, isPaused, prefersReducedMotion]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);
  const handleFocus = () => setIsPaused(true);
  const handleBlur = () => setIsPaused(false);

  const transitionDuration = prefersReducedMotion ? 0 : 0.6;

  return (
    <div
      className="relative w-full max-w-7xl mx-auto"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {/* Main Carousel Container */}
      <div
        className="relative overflow-hidden rounded-2xl bg-muted-background"
        id="hero-carousel-slides"
        role="region"
        aria-label="Featured projects carousel"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: transitionDuration }}
            className="relative"
          >
            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-8 lg:p-12 min-h-[500px]">
              {/* Text Content */}
              <div className="space-y-6 order-2 lg:order-1">
                <div className="space-y-4">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                    {currentProject.title[locale]}
                  </h2>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {currentProject.shortDescription[locale]}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  <Tag className="bg-primary/10 text-primary border-primary/20">
                    {currentProject.domain}
                  </Tag>
                  {currentProject.techStack.slice(0, 3).map((tech) => (
                    <Tag key={tech} className="bg-muted-background">
                      {tech}
                    </Tag>
                  ))}
                </div>

                {/* CTA Link */}
                <Link
                  href={`/work/${currentProject.slug}`}
                  className="inline-flex items-center gap-2 text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  View case study →
                </Link>
              </div>

              {/* Hero Image */}
              <div className="relative order-1 lg:order-2">
                <motion.div
                  initial={{ scale: prefersReducedMotion ? 1 : 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: transitionDuration }}
                  className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-xl"
                >
                  <Image
                    src={heroImage}
                    alt={`${currentProject.title[locale]} project screenshot`}
                    fill
                    className="object-cover"
                    priority={currentIndex === 0}
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between mt-6">
        {/* Previous/Next Buttons */}
        <div className="flex gap-3">
          <button
            onClick={goToPrevious}
            aria-label="Previous project"
            aria-controls="hero-carousel-slides"
            className="px-4 py-2 rounded-lg bg-card-background border border-card-border hover:border-gray-300 dark:hover:border-[rgba(255,255,255,0.2)] transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            ← Previous
          </button>
          <button
            onClick={goToNext}
            aria-label="Next project"
            aria-controls="hero-carousel-slides"
            className="px-4 py-2 rounded-lg bg-card-background border border-card-border hover:border-gray-300 dark:hover:border-[rgba(255,255,255,0.2)] transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Next →
          </button>
        </div>

        {/* Slide Indicators (Dots) */}
        <div className="flex gap-2" role="tablist" aria-label="Project slides">
          {projects.map((project, index) => (
            <button
              key={project.id}
              onClick={() => goToSlide(index)}
              role="tab"
              aria-label={`Go to slide ${index + 1}: ${project.title[locale]}`}
              aria-selected={index === currentIndex}
              aria-current={index === currentIndex ? 'true' : undefined}
              className={`w-3 h-3 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                index === currentIndex
                  ? 'bg-primary w-8'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Status message for screen readers */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Showing project {currentIndex + 1} of {projects.length}: {currentProject.title[locale]}
      </div>
    </div>
  );
}
