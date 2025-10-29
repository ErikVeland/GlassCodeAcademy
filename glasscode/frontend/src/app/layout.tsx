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
        {/* Inline script to avoid initial flash of wrong theme */}
        <Script src="/assets/theme-init.js" strategy="beforeInteractive" />
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