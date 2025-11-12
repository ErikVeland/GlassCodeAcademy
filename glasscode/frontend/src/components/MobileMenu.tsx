"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center p-2 rounded-md text-fg hover:bg-surface-alt hover:text-primary focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg backdrop-blur-sm transition-colors"
      >
        <span className="sr-only">Open main menu</span>
        {/* Hamburger icon */}
        <svg
          className={`${isOpen ? "hidden" : "block"} h-6 w-6`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
        {/* Close icon */}
        <svg
          className={`${isOpen ? "block" : "hidden"} h-6 w-6`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Mobile menu panel */}
      <div
        className={`${isOpen ? "block" : "hidden"} absolute top-16 left-0 right-0 z-[1000] bg-surface backdrop-blur-sm shadow-lg border-t border-border`}
      >
        <div className="pt-2 pb-3 space-y-1">
          <div className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider">
            .NET
          </div>
          <div className="px-4 grid grid-cols-2 gap-2">
            <Link
              href="/lessons"
              className={`${isActive("/lessons") ? "bg-surface-alt text-primary border-primary" : "border-transparent text-muted hover:bg-surface-alt hover:border-border hover:text-primary"} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg`}
              onClick={() => setIsOpen(false)}
            >
              Lessons
            </Link>
            <Link
              href="/interview"
              className={`${isActive("/interview") ? "bg-surface-alt text-primary border-primary" : "border-transparent text-muted hover:bg-surface-alt hover:border-border hover:text-primary"} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg`}
              onClick={() => setIsOpen(false)}
            >
              Quiz
            </Link>
          </div>

          <div className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider mt-4">
            Next.js
          </div>
          <div className="px-4 grid grid-cols-2 gap-2">
            <Link
              href="/nextjs/lessons"
              className={`${isActive("/nextjs/lessons") ? "bg-surface-alt text-primary border-primary" : "border-transparent text-muted hover:bg-surface-alt hover:border-border hover:text-primary"} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg`}
              onClick={() => setIsOpen(false)}
            >
              Lessons
            </Link>
            <Link
              href="/nextjs/interview"
              className={`${isActive("/nextjs/interview") ? "bg-surface-alt text-primary border-primary" : "border-transparent text-muted hover:bg-surface-alt hover:border-border hover:text-primary"} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg`}
              onClick={() => setIsOpen(false)}
            >
              Quiz
            </Link>
          </div>

          <div className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider mt-4">
            GraphQL
          </div>
          <div className="px-4 grid grid-cols-2 gap-2">
            <Link
              href="/graphql/lessons"
              className={`${isActive("/graphql/lessons") ? "bg-surface-alt text-primary border-primary" : "border-transparent text-muted hover:bg-surface-alt hover:border-border hover:text-primary"} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg`}
              onClick={() => setIsOpen(false)}
            >
              Lessons
            </Link>
            <Link
              href="/graphql/interview"
              className={`${isActive("/graphql/interview") ? "bg-surface-alt text-primary border-primary" : "border-transparent text-muted hover:bg-surface-alt hover:border-border hover:text-primary"} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg`}
              onClick={() => setIsOpen(false)}
            >
              Quiz
            </Link>
          </div>

          <div className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider mt-4">
            Laravel
          </div>
          <div className="px-4 grid grid-cols-2 gap-2">
            <Link
              href="/laravel/lessons"
              className={`${isActive("/laravel/lessons") ? "bg-surface-alt text-primary border-primary" : "border-transparent text-muted hover:bg-surface-alt hover:border-border hover:text-primary"} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg`}
              onClick={() => setIsOpen(false)}
            >
              Lessons
            </Link>
            <Link
              href="/laravel/interview"
              className={`${isActive("/laravel/interview") ? "bg-surface-alt text-primary border-primary" : "border-transparent text-muted hover:bg-surface-alt hover:border-border hover:text-primary"} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg`}
              onClick={() => setIsOpen(false)}
            >
              Quiz
            </Link>
          </div>

          <div className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider mt-4">
            React
          </div>
          <div className="px-4 grid grid-cols-2 gap-2">
            <Link
              href="/react/lessons"
              className={`${isActive("/react/lessons") ? "bg-surface-alt text-primary border-primary" : "border-transparent text-muted hover:bg-surface-alt hover:border-border hover:text-primary"} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg`}
              onClick={() => setIsOpen(false)}
            >
              Lessons
            </Link>
            <Link
              href="/react/interview"
              className={`${isActive("/react/interview") ? "bg-surface-alt text-primary border-primary" : "border-transparent text-muted hover:bg-surface-alt hover:border-border hover:text-primary"} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg`}
              onClick={() => setIsOpen(false)}
            >
              Quiz
            </Link>
          </div>

          <div className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider mt-4">
            Tailwind CSS
          </div>
          <div className="px-4 grid grid-cols-2 gap-2">
            <Link
              href="/tailwind/lessons"
              className={`${isActive("/tailwind/lessons") ? "bg-surface-alt text-primary border-primary" : "border-transparent text-muted hover:bg-surface-alt hover:border-border hover:text-primary"} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg`}
              onClick={() => setIsOpen(false)}
            >
              Lessons
            </Link>
            <Link
              href="/tailwind/interview"
              className={`${isActive("/tailwind/interview") ? "bg-surface-alt text-primary border-primary" : "border-transparent text-muted hover:bg-surface-alt hover:border-border hover:text-primary"} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg`}
              onClick={() => setIsOpen(false)}
            >
              Quiz
            </Link>
          </div>

          <div className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider mt-4">
            Node.js
          </div>
          <div className="px-4 grid grid-cols-2 gap-2">
            <Link
              href="/node/lessons"
              className={`${isActive("/node/lessons") ? "bg-surface-alt text-primary border-primary" : "border-transparent text-muted hover:bg-surface-alt hover:border-border hover:text-primary"} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg`}
              onClick={() => setIsOpen(false)}
            >
              Lessons
            </Link>
            <Link
              href="/node/interview"
              className={`${isActive("/node/interview") ? "bg-surface-alt text-primary border-primary" : "border-transparent text-muted hover:bg-surface-alt hover:border-border hover:text-primary"} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg`}
              onClick={() => setIsOpen(false)}
            >
              Quiz
            </Link>
          </div>

          <div className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider mt-4">
            SASS
          </div>
          <div className="px-4 grid grid-cols-2 gap-2">
            <Link
              href="/sass/lessons"
              className={`${isActive("/sass/lessons") ? "bg-surface-alt text-primary border-primary" : "border-transparent text-muted hover:bg-surface-alt hover:border-border hover:text-primary"} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg`}
              onClick={() => setIsOpen(false)}
            >
              Lessons
            </Link>
            <Link
              href="/sass/interview"
              className={`${isActive("/sass/interview") ? "bg-surface-alt text-primary border-primary" : "border-transparent text-muted hover:bg-surface-alt hover:border-border hover:text-primary"} block pl-6 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg`}
              onClick={() => setIsOpen(false)}
            >
              Quiz
            </Link>
          </div>

          <div className="border-t border-border my-2"></div>

          <Link
            href="/forum"
            className={`${isActive("/forum") ? "bg-surface-alt text-primary border-primary" : "border-transparent text-muted hover:bg-surface-alt hover:border-border hover:text-primary"} block pl-3 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg`}
            onClick={() => setIsOpen(false)}
          >
            Forum
          </Link>

          <Link
            href="/"
            className={`${isActive("/") ? "bg-surface-alt text-primary border-primary" : "border-transparent text-muted hover:bg-surface-alt hover:border-border hover:text-primary"} block pl-3 pr-4 py-2 border-l-4 text-base font-medium backdrop-blur-sm focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg`}
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
