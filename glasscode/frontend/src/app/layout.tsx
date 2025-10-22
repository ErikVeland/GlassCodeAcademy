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
import { headers } from 'next/headers';

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
  const cookieHeader = (await headers()).get('cookie') || '';
  const cookieThemeMatch = cookieHeader.match(/(?:^|; )gc-theme=([^;]+)/);
  const cookieTheme = cookieThemeMatch ? decodeURIComponent(cookieThemeMatch[1]) : undefined;
  const initialTheme = cookieTheme === 'dark' || cookieTheme === 'light' ? cookieTheme : 'light';
  return (
    <html lang="en" className={initialTheme} data-theme={initialTheme}>
      <head>
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Inline script to avoid initial flash of wrong theme */}
        <Script src="/theme-init.js" strategy="beforeInteractive" />


      </head>
      <body className={"antialiased min-h-screen relative theme-base"}>
        <ApolloWrapper>
          <ConsoleBanner />
          {/* Dev-only Apollo messages moved to client component to avoid server bundle import issues */}
          <ApolloDevMessages />
          <AuthProvider>
          <ProfileProvider>
            <AccessibilityProvider>
              <DarkModeProvider>
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
                  className="flex-grow w-full sm:max-w-7xl sm:mx-auto px-0 sm:px-6 lg:px-8 py-6 relative"
                  tabIndex={-1}
                >
                  <AnimatedBackground />
                  {children}
                </main>
                <FloatingDarkModeToggle />
                <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-white/20 dark:border-white/10 w-full mt-auto relative">
                  <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                      <div className="flex space-x-6 text-sm">
                        <Link href="/stats" className="text-muted hover:text-fg transition-colors">
                          📊 GlassStats
                        </Link>
                        {EXTERNAL_LINKS.REPO_URL && (
                          <a href={EXTERNAL_LINKS.REPO_URL} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-fg transition-colors">
                            🔗 Source Code
                          </a>
                        )}
                      </div>
                      <p className="text-center text-sm text-muted">
                         © {new Date().getFullYear()} Glass Academy. All rights reserved.
                       </p>
                    </div>
                  </div>
                </footer>
              </div>
              </DarkModeProvider>
            </AccessibilityProvider>
          </ProfileProvider>
          </AuthProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}