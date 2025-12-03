import { HTMLAttributes, ReactNode } from 'react';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  id?: string;
  'aria-labelledby'?: string;
}

export default function Section({ children, className = '', ...props }: SectionProps) {
  return (
    <section
      className={`py-12 md:py-16 max-w-5xl mx-auto px-6 ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
