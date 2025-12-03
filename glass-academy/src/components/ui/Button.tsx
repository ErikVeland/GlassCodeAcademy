import { forwardRef, ButtonHTMLAttributes } from 'react';
import { Link } from '@/i18n/routing';
import { clsx } from 'clsx';
import React from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'gradient';
  href?: string;
  children?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', href, children, ...props }, ref) => {
    const baseStyles =
      'group relative inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none overflow-hidden';

    const variants = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary-dark focus:ring-primary shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
      secondary: 'glass hover:glass-strong text-foreground hover:text-primary focus:ring-primary hover:scale-[1.02] active:scale-[0.98]',
      ghost: 'hover:bg-muted-background/50 text-muted-foreground hover:text-foreground focus:ring-primary transition-smooth',
      gradient: 'bg-gradient-primary text-white shadow-lg hover:shadow-2xl hover:shadow-primary/50 focus:ring-primary hover:scale-[1.02] active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700',
    };

    const styles = clsx(baseStyles, variants[variant], className);

    if (href) {
      return (
        <Link href={href} className={styles}>
          <span className="relative z-10">{children}</span>
        </Link>
      );
    }

    return (
      <button ref={ref} className={styles} {...props}>
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
