import { Link } from '@/i18n/routing';
import { ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;
  href?: string;
  className?: string;
}

export default function Card({ title, children, href, className = '' }: CardProps) {
  const Content = (
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:shadow-md transition-shadow ${className}`}>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <div className="text-gray-600 dark:text-gray-400">
        {children}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg">
        {Content}
      </Link>
    );
  }

  return Content;
}
