'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Project, Locale } from '@/lib/projects';
import { getProjectScreenshots } from '@/lib/projects';
import Lightbox from './Lightbox';

interface ProjectGalleryProps {
  project: Project;
  locale: Locale;
}

export default function ProjectGallery({ project, locale }: ProjectGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const detailImages = getProjectScreenshots(project, 'details') as string[];

  // Don't render if there are no detail images
  if (!detailImages || detailImages.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToNext = () => {
    if (currentImageIndex < detailImages.length - 1) {
      setCurrentImageIndex((prev) => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
    }
  };

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold">Project Screenshots</h2>
      
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {detailImages.map((image, index) => (
          <button
            key={image}
            onClick={() => openLightbox(index)}
            className="relative aspect-video rounded-lg overflow-hidden border border-card-border hover:border-gray-300 dark:hover:border-[rgba(255,255,255,0.2)] transition-all group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={`View screenshot ${index + 1} of ${project.title[locale]}`}
          >
            <Image
              src={image}
              alt={`${project.title[locale]} - Screenshot ${index + 1}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Lightbox
        images={detailImages}
        currentIndex={currentImageIndex}
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        onNext={goToNext}
        onPrevious={goToPrevious}
        altTextPrefix={project.title[locale]}
      />
    </section>
  );
}
