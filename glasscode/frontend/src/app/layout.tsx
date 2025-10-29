import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import "../styles/design-system.scss";
import "../styles/liquid-glass.scss";
import Header from '../components/Header';
import FloatingDarkModeToggle from '../components/FloatingDarkModeToggle';
import { DarkModeProvider } from '../components/DarkModeContext';
import AnimatedBackground from '../components/AnimatedBackground';
import { AccessibilityProvider } from '../components/AccessibilityProvider';
import ApolloWrapper from '../components/ApolloWrapper';
import AuthProvider from '../components/AuthProvider';
import ProfileProvider from '../components/ProfileProvider';
import AdminQueryHandler from '../components/AdminQueryHandler';
import QuizPrefetchManager from '../components/QuizPrefetchManager';
import QuizPrefetchTest from '../components/QuizPrefetchTest';
import { Suspense } from 'react';
import { EXTERNAL_LINKS } from '@/lib/appConfig';
import Script from 'next/script';
import ApolloDevMessages from '../components/ApolloDevMessages';
import ConsoleBanner from '../components/ConsoleBanner';
import BackendReadinessWrapper from '../components/BackendReadinessWrapper';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: "GlassCode Academy - Learn .NET, Next.js, GraphQL, and Laravel",
  description: "Master .NET, Next.js, GraphQL, and Laravel with step-by-step lessons and interview preparation",
  icons: {
    icon: [
      { url: '/favicon.svg' },
      { url: '/favicon-16x16.svg', sizes: '16x16' },
      { url: '/favicon-32x32.svg', sizes: '32x32' },
    ],
    apple: '/apple-touch-icon.svg',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('gc-theme')?.value;
  const initialTheme = (themeCookie === 'dark' || themeCookie === 'light') ? themeCookie : 'light';

  return (
    <html lang="en" data-theme={initialTheme} className={initialTheme === 'dark' ? 'dark' : undefined} style={{ colorScheme: initialTheme === 'dark' ? 'dark' : 'light' }}>
      <head>
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Inline scripts to avoid initial flash and enable pre-hydration toggle clicks */}
        <Script id="gc-theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{
          __html: `/* GlassCode theme initializer: applies persisted or system theme early */
            (function(){
              try {
                var match = document.cookie.match(/(?:^|; )gc-theme=([^;]+)/);
                var cookieTheme = match ? decodeURIComponent(match[1]) : '';
                var storedTheme = localStorage.getItem('theme');
                var legacy = localStorage.getItem('darkMode');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var html = document.documentElement;

                var selected = (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system')
                  ? storedTheme
                  : ((cookieTheme === 'light' || cookieTheme === 'dark')
                      ? cookieTheme
                      : (legacy === 'true' ? 'dark' : legacy === 'false' ? 'light' : 'system'));

                var finalTheme = selected === 'system' ? (prefersDark ? 'dark' : 'light') : selected;

                html.classList.remove('dark');
                if (finalTheme === 'dark') {
                  html.classList.add('dark');
                  try { html.style.colorScheme = 'dark'; } catch {}
                } else {
                  try { html.style.colorScheme = 'light'; } catch {}
                }
                html.setAttribute('data-theme', finalTheme);
              } catch { /* noop */ }
            })();
            /* Pre-hydration toggle: make the theme button responsive before React mounts */
            (function(){
              try {
                var html = document.documentElement;
                var mql = window.matchMedia('(prefers-color-scheme: dark)');
                var attach = function(){
                  var btn = document.querySelector('button[data-testid="theme-toggle"]');
                  if (!btn) return;
                  var getNext = function(prev){
                    if (prev === 'system') return mql.matches ? 'light' : 'dark';
                    if (prev === 'dark') return 'light';
                    return 'system';
                  };
                  var applyTheme = function(theme){
                    var prefersDark = mql.matches;
                    var activeDark = theme === 'dark' || (theme === 'system' && prefersDark);
                    if (activeDark) {
                      html.classList.add('dark');
                      try { html.style.colorScheme = 'dark'; } catch {}
                    } else {
                      html.classList.remove('dark');
                      try { html.style.colorScheme = 'light'; } catch {}
                    }
                    html.setAttribute('data-theme', theme === 'system' ? (activeDark ? 'dark' : 'light') : theme);
                    try {
                      localStorage.setItem('theme', theme);
                      localStorage.removeItem('darkMode');
                    } catch {}
                    var label = theme === 'system' ? 'Theme: System (auto)' : (theme === 'dark' ? 'Theme: Dark' : 'Theme: Light');
                    try {
                      btn.setAttribute('aria-label', label);
                      btn.setAttribute('title', label + ' — click to cycle');
                    } catch {}
                  };
                  var handler = function(){
                    try {
                      var current = localStorage.getItem('theme') || 'system';
                      var next = getNext(current);
                      applyTheme(next);
                    } catch {}
                  };
                  btn.addEventListener('click', handler, { passive: true });
                  // Provide hook for React to remove this fallback
                  window.__gcRemovePreHydrationToggle = function(){
                    try { btn.removeEventListener('click', handler); delete window.__gcRemovePreHydrationToggle; } catch {}
                  };
                };
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', attach, { once: true });
                } else {
                  attach();
                }
              } catch { /* noop */ }
            })();`
        }} />
      </head>
      <body className={"antialiased min-h-screen relative theme-base"}>
        <DarkModeProvider>
        <ApolloWrapper>
          <ConsoleBanner />
          {/* Dev-only Apollo messages moved to client component to avoid server bundle import issues */}
          <ApolloDevMessages />
          <AuthProvider>
          <ProfileProvider>
            <AccessibilityProvider>
              <div className="flex flex-col min-h-screen">
                <Suspense fallback={null}>
                  <AdminQueryHandler />
                </Suspense>
                <QuizPrefetchManager />
                <Suspense fallback={null}>
                  <QuizPrefetchTest />
                </Suspense>
                {/* Skip to main content link for accessibility */}
                <a
                  href="#main-content"
                  className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded"
                >
                  Skip to main content
                </a>
                <Header />
                <main
                  id="main-content"
                  className="flex-grow w-full sm:max-w-7xl sm:mx-auto px-0 sm:px-6 lg:px-8 py-0 md:py-6 relative"
                  tabIndex={-1}
                >
                  <AnimatedBackground />
                  <BackendReadinessWrapper>
                    {children}
                  </BackendReadinessWrapper>
                </main>
                <FloatingDarkModeToggle />
                <footer className="bg-surface backdrop-blur-sm border-t border-border w-full mt-auto relative">
                  <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                      <div className="flex space-x-6 text-sm">
                        <Link href="/stats" className="text-fg hover:text-fg transition-colors">
                          📊 GlassStats
                        </Link>
                        {EXTERNAL_LINKS.REPO_URL && (
                          <a href={EXTERNAL_LINKS.REPO_URL} target="_blank" rel="noopener noreferrer" className="text-fg hover:text-fg transition-colors">
                            🔗 Source Code
                          </a>
                        )}
                      </div>
                      <p className="text-center text-sm text-fg">
                         © {new Date().getFullYear()} Glass Academy. All rights reserved.
                       </p>
                    </div>
                  </div>
                </footer>
              </div>
            </AccessibilityProvider>
          </ProfileProvider>
          </AuthProvider>
        </ApolloWrapper>
        </DarkModeProvider>
      </body>
    </html>
  );
}