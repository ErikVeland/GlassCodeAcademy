'use client';

import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const domains = [
  'Investigative Journalism',
  'Public-Interest Research',
  'Education & Learning',
  'Cultural Projects',
  'Experimental Prototypes',
];

export default function ClientStrip() {
  const prefersReducedMotion = usePrefersReducedMotion();

  // Duplicate the domains array for seamless infinite scroll
  const duplicatedDomains = [...domains, ...domains];

  return (
    <div
      className="relative overflow-hidden py-8 border-y border-border"
      aria-label="Project domains and focus areas"
    >
      <div className="relative">
        {prefersReducedMotion ? (
          // Static display when reduced motion is preferred
          <div className="flex justify-center items-center gap-8 px-4">
            {domains.map((domain, index) => (
              <span
                key={index}
                className="text-lg md:text-xl text-muted-foreground whitespace-nowrap"
              >
                {domain}
              </span>
            ))}
          </div>
        ) : (
          // Animated scroll when motion is allowed
          <motion.div
            className="flex gap-8"
            animate={{
              x: [0, -50 + '%'],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: 30,
                ease: 'linear',
              },
            }}
          >
            {duplicatedDomains.map((domain, index) => (
              <div
                key={index}
                className="flex items-center gap-8 whitespace-nowrap"
              >
                <span className="text-lg md:text-xl text-muted-foreground">
                  {domain}
                </span>
                {index < duplicatedDomains.length - 1 && (
                  <span className="text-muted-foreground/30">•</span>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
