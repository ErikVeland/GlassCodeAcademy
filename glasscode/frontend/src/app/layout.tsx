import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
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
import GlobalStyles from '../components/GlobalStyles';

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

// Lock viewport on mobile to prevent accidental zooming
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('gc-theme')?.value;
  const hasCookieTheme = (themeCookie === 'dark' || themeCookie === 'light');

  return (
    <html
      lang="en"
      data-theme={hasCookieTheme ? themeCookie : 'light'}
      className={hasCookieTheme && themeCookie === 'dark' ? 'dark' : undefined}
      style={{ colorScheme: hasCookieTheme && themeCookie === 'dark' ? 'dark' : 'light' }}
    >
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
                  : (legacy === 'true' ? 'dark' : legacy === 'false' ? 'light' : 'system');

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
            /* Pre-hydration toggle: attach to ALL buttons and keep labels in sync */
            (function(){
              try {
                var html = document.documentElement;
                var mql = window.matchMedia('(prefers-color-scheme: dark)');
                var attachedButtons = new Set();
                var getNext = function(prev){
                  if (prev === 'system') {
                    var prefersDark = mql.matches;
                    // When in system mode, cycle to dark if OS prefers light, or to light if OS prefers dark
                    return prefersDark ? 'light' : 'dark';
                  }
                  if (prev === 'dark') return 'light';
                  return 'system';
                };
                var updateAllLabels = function(label){
                  try {
                    attachedButtons.forEach(function(btn){
                      try {
                        btn.setAttribute('aria-label', label);
                        btn.setAttribute('title', label + ' — click to cycle');
                      } catch {}
                    });
                  } catch {}
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
                  // Signal theme selection to React after hydration
                  try {
                    window.__gcPendingTheme = theme;
                    window.dispatchEvent(new CustomEvent('gc-theme-change', { detail: { theme: theme } }));
                  } catch {}
                  var label = theme === 'system' ? 'Theme: System (auto)' : (theme === 'dark' ? 'Theme: Dark' : 'Theme: Light');
                  updateAllLabels(label);
                };
                var handler = function(){
                  try {
                    var current = localStorage.getItem('theme') || 'system';
                    var next = getNext(current);
                    applyTheme(next);
                  } catch {}
                };
                var attachToAll = function(){
                  var btns = document.querySelectorAll('button[data-testid="theme-toggle"]');
                  if (!btns || btns.length === 0) return;
                  btns.forEach(function(btn){
                    if (!attachedButtons.has(btn)) {
                      // Pre-hydration handler should fully handle clicks and prevent React double-toggling
                      var wrapped = function(ev){
                        try {
                          ev.preventDefault();
                          ev.stopPropagation();
                          // Stop other listeners on the same element from firing
                          if (typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
                        } catch {}
                        handler();
                      };
                      btn.addEventListener('click', wrapped, { passive: false });
                      attachedButtons.add(btn);
                      // Store original handler reference for removal later
                      try { (btn).__gcPreHydrationWrapped = wrapped; } catch {}
                      try {
                        var current = localStorage.getItem('theme') || 'system';
                        var label = current === 'system' ? 'Theme: System (auto)' : (current === 'dark' ? 'Theme: Dark' : 'Theme: Light');
                        btn.setAttribute('aria-label', label);
                        btn.setAttribute('title', label + ' — click to cycle');
                      } catch {}
                    }
                  });
                  // Provide hook for React to remove this fallback from ALL buttons
                  window.__gcRemovePreHydrationToggle = function(){
                    try {
                      attachedButtons.forEach(function(btn){
                        try {
                          var w = (btn).__gcPreHydrationWrapped;
                          if (w) { btn.removeEventListener('click', w); }
                          delete (btn).__gcPreHydrationWrapped;
                        } catch {}
                      });
                      attachedButtons.clear();
                      delete window.__gcRemovePreHydrationToggle;
                    } catch {}
                  };
                };
                // Attach immediately if available, otherwise observe until present or new buttons appear
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', function(){
                    attachToAll();
                    var mo = new MutationObserver(function(){ attachToAll(); });
                    mo.observe(document.body, { childList: true, subtree: true });
                  }, { once: true });
                } else {
                  attachToAll();
                  var mo2 = new MutationObserver(function(){ attachToAll(); });
                  mo2.observe(document.body, { childList: true, subtree: true });
                }
              } catch { /* noop */ }
            })();`
        }} />
      </head>
      <body className={"antialiased min-h-screen relative theme-base"}>
        <GlobalStyles />
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