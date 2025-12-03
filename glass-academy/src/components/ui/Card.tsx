import { Link } from '@/i18n/routing';
import { ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;
  href?: string;
  className?: string;
  variant?: 'default' | 'glass' | 'elevated';
}

export default function Card({ title, children, href, className = '', variant = 'default' }: CardProps) {
  const baseStyles = 'group rounded-2xl p-8 transition-all duration-500';
  
  const variantStyles = {
    default: 'bg-card-background border border-card-border hover:border-primary/30 hover:shadow-xl',
    glass: 'glass hover:glass-strong hover:scale-[1.01]',
    elevated: 'bg-card-background border border-card-border shadow-lg hover:shadow-2xl hover:-translate-y-2',
  };
  
  const Content = (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      <h3 className="text-2xl font-bold mb-4 transition-colors duration-300 group-hover:text-primary">
        {title}
      </h3>
      <div className="text-muted-foreground leading-relaxed text-lg group-hover:text-foreground transition-colors duration-300">
        {children}
      </div>
      {href && (
        <div className="mt-6 flex items-center text-primary font-medium group-hover:gap-3 gap-2 transition-all duration-300">
          <span>Learn more</span>
          <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus-ring-glow rounded-2xl">
        {Content}
      </Link>
    );
  }

  return Content;
}
