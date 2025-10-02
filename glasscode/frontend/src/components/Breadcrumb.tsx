'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  isCurrentPage?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const pathname = usePathname();
  
  // Generate breadcrumb items from pathname if not provided
  const breadcrumbItems = items || generateBreadcrumbFromPath(pathname);

  return (
    <nav 
      className={`flex ${className}`} 
      aria-label="Breadcrumb"
      role="navigation"
    >
      <ol className="flex items-center space-x-2 text-sm">
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon 
                className="flex-shrink-0 h-4 w-4 text-gray-400 mx-2" 
                aria-hidden="true"
              />
            )}
            
            {item.isCurrentPage ? (
              <span 
                className="text-gray-900 dark:text-gray-100 font-medium flex items-center gap-1"
                aria-current="page"
              >
                {item.icon}
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href || '#'}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                {item.icon}
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function generateBreadcrumbFromPath(pathname: string): BreadcrumbItem[] {
  const pathSegments = pathname.split('/').filter(segment => segment !== '');
  const breadcrumbs: BreadcrumbItem[] = [];

  // Always start with home
  breadcrumbs.push({
    label: 'Home',
    href: '/',
    icon: <HomeIcon className="h-4 w-4" />
  });

  // Handle specific route patterns
  if (pathSegments.length === 0) {
    // Homepage - mark as current
    breadcrumbs[0].isCurrentPage = true;
    return breadcrumbs;
  }

  let currentPath = '';
  
  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i];
    currentPath += `/${segment}`;
    
    const isLast = i === pathSegments.length - 1;
    
    if (segment === 'modules') {
      // Don't add 'modules' as a breadcrumb item
      continue;
    } else if (pathSegments[i - 1] === 'modules') {
      // This is a module slug
      breadcrumbs.push({
        label: formatModuleName(segment),
        href: isLast ? undefined : `/modules/${segment}`,
        isCurrentPage: isLast
      });
    } else if (segment === 'lessons') {
      breadcrumbs.push({
        label: 'Lessons',
        href: isLast ? undefined : currentPath,
        isCurrentPage: isLast
      });
    } else if (segment === 'quiz') {
      breadcrumbs.push({
        label: 'Assessment',
        href: isLast ? undefined : currentPath,
        isCurrentPage: isLast
      });
    } else if (pathSegments[i - 1] === 'lessons' && /^\d+$/.test(segment)) {
      // This is a lesson number
      breadcrumbs.push({
        label: `Lesson ${segment}`,
        href: isLast ? undefined : currentPath,
        isCurrentPage: isLast
      });
    } else {
      // Generic segment
      breadcrumbs.push({
        label: formatSegmentName(segment),
        href: isLast ? undefined : currentPath,
        isCurrentPage: isLast
      });
    }
  }

  return breadcrumbs;
}

function formatModuleName(slug: string): string {
  // Convert slug to readable name
  const name = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  // Handle special cases
  const specialCases: Record<string, string> = {
    'React Fundamentals': 'React',
    'Dotnet Fundamentals': '.NET Core',
    'Database Systems': 'Database',
    'Typescript Fundamentals': 'TypeScript',
    'Node Fundamentals': 'Node.js',
    'Laravel Fundamentals': 'Laravel',
    'Nextjs Advanced': 'Next.js',
    'Graphql Advanced': 'GraphQL',
    'Sass Advanced': 'Sass/SCSS',
    'Tailwind Advanced': 'Tailwind CSS',
    'Vue Advanced': 'Vue.js',
    'Testing Fundamentals': 'Testing',
    'E2e Testing': 'E2E Testing',
    'Performance Optimization': 'Performance',
    'Security Fundamentals': 'Security'
  };
  
  return specialCases[name] || name;
}

function formatSegmentName(segment: string): string {
  return segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Specialized breadcrumb components for common patterns
export function ModuleBreadcrumb({ 
  moduleTitle, 
  moduleSlug, 
  currentPage 
}: { 
  moduleTitle: string; 
  moduleSlug: string; 
  currentPage?: string;
}) {
  const items: BreadcrumbItem[] = [
    {
      label: 'Home',
      href: '/',
      icon: <HomeIcon className="h-4 w-4" />
    },
    {
      label: moduleTitle,
      href: currentPage ? `/modules/${moduleSlug}` : undefined,
      isCurrentPage: !currentPage
    }
  ];

  if (currentPage) {
    items.push({
      label: currentPage,
      isCurrentPage: true
    });
  }

  return <Breadcrumb items={items} />;
}

export function LessonBreadcrumb({ 
  moduleTitle, 
  moduleSlug, 
  lessonTitle, 
  lessonNumber 
}: { 
  moduleTitle: string; 
  moduleSlug: string; 
  lessonTitle: string; 
  lessonNumber: number;
}) {
  const items: BreadcrumbItem[] = [
    {
      label: 'Home',
      href: '/',
      icon: <HomeIcon className="h-4 w-4" />
    },
    {
      label: moduleTitle,
      href: `/modules/${moduleSlug}`
    },
    {
      label: 'Lessons',
      href: `/modules/${moduleSlug}/lessons`
    },
    {
      label: `Lesson ${lessonNumber}`,
      isCurrentPage: true
    }
  ];

  return <Breadcrumb items={items} />;
}