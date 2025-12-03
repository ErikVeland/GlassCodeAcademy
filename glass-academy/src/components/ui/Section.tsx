import { HTMLAttributes, ReactNode } from 'react';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  id?: string;
  'aria-labelledby'?: string;
  fullWidth?: boolean;
}

export default function Section({ children, className = '', fullWidth = false, ...props }: SectionProps) {
  const widthClass = fullWidth ? 'w-full' : 'max-w-5xl mx-auto px-6';
  
  return (
    <section
      className={`py-12 md:py-16 ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
