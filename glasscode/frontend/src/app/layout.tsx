import type { Metadata } from "next";
import "./globals.css";
import Header from '../components/Header';
import { DarkModeProvider } from '../components/DarkModeContext';
import AnimatedBackground from '../components/AnimatedBackground';
import { AccessibilityProvider } from '../components/AccessibilityProvider';
import ApolloWrapper from '../components/ApolloWrapper';
import AuthProvider from '../components/AuthProvider';
import AdminQueryHandler from '../components/AdminQueryHandler';
import { Suspense } from 'react';

// Apollo error/dev messages for development
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // Dynamically import to avoid including in production bundle
  import('@apollo/client/dev').then(({ loadDevMessages, loadErrorMessages }) => {
    loadDevMessages();
    loadErrorMessages();
  });
}

// Fonts are loaded from Google Fonts CDN via <link> tags in <head>.

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=JetBrains+Mono:wght@100..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`antialiased min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative`}>
        <ApolloWrapper>
          <AuthProvider>
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
                
                {/* Animated Background Component */}
                <AnimatedBackground />
                <Header />
                <main 
                  id="main-content" 
                  className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative"
                  tabIndex={-1}
                >
                  {children}
                </main>
                <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 w-full max-w-7xl mx-auto mt-auto relative">
                  <div className="py-6 px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                      {new Date().getFullYear()} <a href="https://veland.au">Erik Veland</a>. No rights reserved. Go ahead, <a href="https://github.com/ErikVeland/GlassCodeAcademy" target="_blank" rel="noopener noreferrer">fork and learn</a>!
                    </p>
                  </div>
                </footer>
              </div>
            </DarkModeProvider>
          </AccessibilityProvider>
          </AuthProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}