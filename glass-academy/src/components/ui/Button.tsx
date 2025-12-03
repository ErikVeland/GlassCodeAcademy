import { forwardRef, ButtonHTMLAttributes } from 'react';
import { Link } from '@/i18n/routing';
import { clsx } from 'clsx';
import React from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  href?: string;
  children?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', href, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
      primary: 'bg-primary text-primary-foreground hover:bg-blue-700 focus:ring-primary',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
      ghost: 'hover:bg-gray-100 text-gray-700 hover:text-gray-900 dark:hover:bg-gray-800 dark:text-gray-300 dark:hover:text-gray-100 focus:ring-gray-500',
    };

    const styles = clsx(baseStyles, variants[variant], className);

    if (href) {
      return (
        <Link href={href} className={styles}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={styles} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
