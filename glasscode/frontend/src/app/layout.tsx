import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import "../styles/design-system.scss";
import "../styles/liquid-glass.scss";
import Header from '../components/Header';
import FloatingDarkModeToggle from '../components/FloatingDarkModeToggle';
import { DarkModeProvider } from '../components/DarkModeContext';

import { AccessibilityProvider } from '../components/AccessibilityProvider';
import ApolloWrapper from '../components/ApolloWrapper';
import AuthProvider from '../components/AuthProvider';
import ProfileProvider from '../components/ProfileProvider';
import AdminQueryHandler from '../components/AdminQueryHandler';
import GlobalAnimatedBackground from '../components/GlobalAnimatedBackground';
import { Suspense } from 'react';
import { EXTERNAL_LINKS } from '@/lib/appConfig';
// Removed next/font usage to revert to system fonts

// Apollo error/dev messages for development
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // Dynamically import to avoid including in production bundle
  import('@apollo/client/dev').then(({ loadDevMessages, loadErrorMessages }) => {
    loadDevMessages();
    loadErrorMessages();
  });
}

// Fonts are loaded via next/font to avoid hardcoded external URLs.

export const metadata: Metadata = {
  title: "GlassCode Academy - Learn .NET, Next.js, GraphQL, and Laravel",
  description: "Master .NET, Next.js, GraphQL, and Laravel with step-by-step lessons and interview preparation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head></head>
      <body className={"antialiased min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative"}>
        <GlobalAnimatedBackground />
        <ApolloWrapper>
          <AuthProvider>
          <ProfileProvider>
            <AccessibilityProvider>
              <DarkModeProvider>
              <div className="flex flex-col min-h-screen">
                <Suspense fallback={null}>
                  <AdminQueryHandler />
                </Suspense>
                {/* Skip to main content link for accessibility */}
                <a
                  href="#main-content"
                  className="skip-to-content"
                >
                  Skip to main content
                </a>


                <Suspense fallback={
                  <div className="py-4 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700">
                        <div className="text-center">
                          <p className="text-gray-600 dark:text-gray-300">Loading header...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                }>
                  <Header />
                </Suspense>
                {/* Floating dark mode toggle in bottom-right */}
                <FloatingDarkModeToggle />
                <main
                  id="main-content"
                  className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative"
                  tabIndex={-1}
                >
                  <Suspense fallback={
                    <div className="py-12 px-4 sm:px-6 lg:px-8">
                      <div className="max-w-4xl mx-auto">
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                          <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Loading</h2>
                            <p className="text-gray-600 dark:text-gray-300">Preparing content...</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  }>
                    {children}
                  </Suspense>
                </main>
                <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 w-full mt-auto relative">
                  <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                      <div className="flex space-x-6 text-sm">
                        <Link href="/stats" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                          📊 GlassStats
                        </Link>
                        {EXTERNAL_LINKS.REPO_URL && (
                          <a href={EXTERNAL_LINKS.REPO_URL} target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            🔗 Source Code
                          </a>
                        )}
                      </div>
                      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
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
