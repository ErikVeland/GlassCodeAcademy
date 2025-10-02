'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AnimatedBackground from '../../components/AnimatedBackground';
import EnhancedLoadingComponent from '../../components/EnhancedLoadingComponent';

export default function AnimatedBackgroundDemo() {
  const [colors, setColors] = useState([
    "rgba(99, 102, 241, 0.12)",   // indigo
    "rgba(168, 85, 247, 0.12)",   // purple
    "rgba(236, 72, 153, 0.12)",   // pink
    "rgba(16, 185, 129, 0.12)",   // green
    "rgba(245, 158, 11, 0.12)",   // yellow
    "rgba(239, 68, 68, 0.12)"     // red
  ]);
  
  const [speed, setSpeed] = useState(25);
  const [blur, setBlur] = useState(55);
  const [opacity, setOpacity] = useState(0.77);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const presetColors = [
    {
      name: "Ocean Breeze",
      colors: [
        "rgba(59, 130, 246, 0.15)",
        "rgba(139, 92, 246, 0.15)",
        "rgba(16, 185, 129, 0.15)",
        "rgba(56, 189, 248, 0.15)",
        "rgba(14, 165, 233, 0.15)"
      ]
    },
    {
      name: "Sunset Glow",
      colors: [
        "rgba(251, 146, 60, 0.15)",
        "rgba(249, 115, 22, 0.15)",
        "rgba(236, 72, 153, 0.15)",
        "rgba(217, 70, 239, 0.15)",
        "rgba(245, 158, 11, 0.15)"
      ]
    },
    {
      name: "Forest Mist",
      colors: [
        "rgba(16, 185, 129, 0.15)",
        "rgba(14, 165, 233, 0.15)",
        "rgba(52, 211, 153, 0.15)",
        "rgba(45, 212, 191, 0.15)",
        "rgba(34, 197, 94, 0.15)"
      ]
    },
    {
      name: "Cosmic Nebula",
      colors: [
        "rgba(139, 92, 246, 0.15)",
        "rgba(168, 85, 247, 0.15)",
        "rgba(236, 72, 153, 0.15)",
        "rgba(217, 70, 239, 0.15)",
        "rgba(99, 102, 241, 0.15)"
      ]
    },
    {
      name: "Full Spectrum",
      colors: [
        "rgba(99, 102, 241, 0.12)",   // indigo (blue)
        "rgba(168, 85, 247, 0.12)",   // purple
        "rgba(236, 72, 153, 0.12)",   // pink
        "rgba(16, 185, 129, 0.12)",   // green
        "rgba(245, 158, 11, 0.12)",   // yellow
        "rgba(239, 68, 68, 0.12)",    // red
        "rgba(59, 130, 246, 0.12)",   // blue
        "rgba(139, 92, 246, 0.12)",   // violet
        "rgba(251, 146, 60, 0.12)",   // orange
        "rgba(14, 165, 233, 0.12)"    // sky blue
      ]
    }
  ];

  const applyPreset = (preset: { name: string; colors: string[] }) => {
    setColors(preset.colors);
  };

  // Handle manual retry
  const handleManualRetry = () => {
    setRetryCount(0);
    setError(null);
    setLoading(true);
    
    // Simulate a loading process
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  // Show loading state
  if (loading) {
    if (retryCount > 0) {
      return (
        <div className="min-h-screen relative">
          <AnimatedBackground 
            colors={colors}
            speed={speed}
            blur={blur}
            opacity={opacity}
          />
          <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
              <EnhancedLoadingComponent 
                retryCount={retryCount} 
                maxRetries={30} 
                onRetry={handleManualRetry}
              />
            </div>
          </div>
        </div>
      );
    }
    
    // Show initial loading state without opaque background
    return (
      <div className="min-h-screen relative">
        <AnimatedBackground 
          colors={colors}
          speed={speed}
          blur={blur}
          opacity={opacity}
        />
        <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse flex flex-col items-center justify-center space-y-4">
              <div className="h-12 w-2/3 bg-white/30 dark:bg-gray-700/30 rounded"></div>
              <div className="h-64 w-full bg-white/30 dark:bg-gray-700/30 rounded"></div>
              <div className="h-10 w-1/3 bg-white/30 dark:bg-gray-700/30 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error only after loading
  if (error) {
    return (
      <div className="min-h-screen relative">
        <AnimatedBackground 
          colors={colors}
          speed={speed}
          blur={blur}
          opacity={opacity}
        />
        <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-3xl">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h2>
                <p className="mb-4 text-gray-800 dark:text-gray-200">{error}</p>
                <button
                  onClick={handleManualRetry}
                  className="px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    // Keep the original background for this demo page since it's showcasing the animated background component
    <div className="min-h-screen relative">
      <a href="#main-content" className="sr-only focus:absolute focus:p-4 focus:bg-white dark:focus:bg-gray-800 focus:text-blue-600 dark:focus:text-blue-400 z-50">
        Skip to main content
      </a>
      {/* Animated Background Component */}
      <AnimatedBackground 
        colors={colors}
        speed={speed}
        blur={blur}
        opacity={opacity}
      />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header - Modified to have transparent background */}
        <header className="bg-transparent border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Animated Background Demo
              </h1>
              <Link 
                href="/" 
                className="inline-block mb-4 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 font-semibold py-1 px-2 rounded shadow hover:bg-pink-200 dark:hover:bg-pink-800 transition-colors duration-150 flex items-center gap-1 text-xs"
              >
                <span className="text-base">←</span> Back to Home
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main id="main-content" className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-3xl">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Animated Background Component
                  </h2>
                  <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                    This demo showcases a reusable animated background component that can be customized with different colors, speeds, blur, and opacity.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Controls */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Customization Controls
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="speed-control" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Animation Speed: {speed}s
                        </label>
                        <input
                          id="speed-control"
                          type="range"
                          min="5"
                          max="60"
                          value={speed}
                          onChange={(e) => setSpeed(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                          aria-label="Animation speed control"
                        />
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>Fast</span>
                          <span>Slow</span>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="blur-control" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Blur: {blur}px
                        </label>
                        <input
                          id="blur-control"
                          type="range"
                          min="0"
                          max="100"
                          value={blur}
                          onChange={(e) => setBlur(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                          aria-label="Blur effect control"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="opacity-control" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Opacity: {opacity.toFixed(2)}
                        </label>
                        <input
                          id="opacity-control"
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={opacity}
                          onChange={(e) => setOpacity(parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                          aria-label="Background opacity control"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-8">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                        Color Presets
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {presetColors.map((preset, index) => (
                          <button
                            key={index}
                            onClick={() => applyPreset(preset)}
                            className="py-2 px-3 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                            aria-label={`Apply ${preset.name} color preset`}
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Preview */}
                  <div className="flex flex-col">
                    <div className="bg-gray-900 rounded-xl p-6 flex-grow flex flex-col">
                      <h3 className="text-xl font-semibold text-white mb-4">
                        Live Preview
                      </h3>
                      <div className="flex-grow flex items-center justify-center">
                        <div className="text-center">
                          <div className="inline-block p-4 rounded-full bg-white/10 backdrop-blur-sm mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                            </svg>
                          </div>
                          <p className="text-white/80">
                            Background animation is active
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                      <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Implementation
                      </h3>
                      <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
                        To use this component in your pages:
                      </p>
                      <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
                        {`import AnimatedBackground from '../components/AnimatedBackground';

<AnimatedBackground 
  colors={["rgba(99, 102, 241, 0.12)", "..."]}
  speed={25}
  blur={55}
  opacity={0.77}
/>`}
                      </pre>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    This animated background component can be used on any page to create a sophisticated, 
                    customizable background effect that enhances the visual appeal of your application.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}