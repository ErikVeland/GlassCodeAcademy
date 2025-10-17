'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import AnimatedBackground from '../../components/AnimatedBackground';
import EnhancedLoadingComponent from '../../components/EnhancedLoadingComponent';
import ColorSchemeEditorPopup from '../../components/ColorSchemeEditorPopup';

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
  const [respectReducedMotion, setRespectReducedMotion] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [previewIsPaused, setPreviewIsPaused] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isColorEditorOpen, setIsColorEditorOpen] = useState(false);

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
        "rgba(239, 68, 68, 0.12)",     // red
        "rgba(59, 130, 246, 0.12)",   // blue
        "rgba(139, 92, 246, 0.12)",   // violet
        "rgba(251, 146, 60, 0.12)",   // orange
        "rgba(14, 165, 233, 0.12)"    // sky blue
      ]
    },
    {
      name: "Aurora Borealis",
      colors: [
        "rgba(34, 197, 94, 0.15)",    // emerald
        "rgba(59, 130, 246, 0.15)",   // blue
        "rgba(168, 85, 247, 0.15)",   // purple
        "rgba(236, 72, 153, 0.15)",   // pink
        "rgba(14, 165, 233, 0.15)",   // sky
        "rgba(16, 185, 129, 0.15)"    // teal
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
        respectReducedMotion={respectReducedMotion}
        isPaused={isPaused}
        onAnimationUpdate={setAnimationPosition}
      />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
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
                        <label htmlFor="reduced-motion-toggle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Respect Reduced Motion
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            id="reduced-motion-toggle"
                            type="checkbox"
                            checked={respectReducedMotion}
                            onChange={(e) => setRespectReducedMotion(e.target.checked)}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {respectReducedMotion ? 'Enabled' : 'Disabled (animation forced for demo)'}
                          </span>
                        </div>
                      </div>
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
                      <button
                        onClick={() => setIsColorEditorOpen(true)}
                        className="w-full px-6 py-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-blue-200 transition-colors duration-200 flex items-center justify-center group"
                      >
                        <div className="text-center">
                          <div className="text-lg font-medium">Advanced Color Editor</div>
                          <div className="text-sm text-blue-300/80">Create custom gradients with precise color control</div>
                        </div>
                      </button>
                    </div>
                    
                    {/* Quick Presets */}
                    <div className="mt-6">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                        Quick Presets
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
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-white">
                          Live Preview
                        </h3>
                        <button
                          onClick={() => setIsPaused(!isPaused)}
                          className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-200"
                          aria-label={isPaused ? "Play animation" : "Pause animation"}
                        >
                          {isPaused ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                            </svg>
                          )}
                          <span className="text-white text-sm">
                            {isPaused ? 'Play' : 'Pause'}
                          </span>
                        </button>
                      </div>
                      
                      {/* Minimized Animation Preview */}
                      <div className="flex-grow flex items-center justify-center">
                        <div 
                          onClick={() => setPreviewIsPaused(!previewIsPaused)}
                          className={`relative w-64 h-40 rounded-lg overflow-hidden border-2 border-white/20 transition-all duration-500 cursor-pointer hover:border-white/40 hover:scale-105 ${
                            previewIsPaused ? 'opacity-60' : 'opacity-100'
                          }`}
                          title="Click to pause/play preview animation"
                        >
                          <AnimatedBackground 
                            colors={colors}
                            speed={speed * 0.8} // Slightly different speed for preview
                            blur={blur * 0.7} // Less blur for better visibility
                            opacity={Math.min(opacity * 1.5, 1)} // Make it more visible in preview
                            respectReducedMotion={respectReducedMotion}
                            isPaused={previewIsPaused}
                            className="absolute inset-0"
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                              <div className="inline-block p-3 rounded-full bg-white/10 backdrop-blur-sm mb-2">
                                {previewIsPaused ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                )}
                              </div>
                              <p className="text-white/80 text-sm font-medium">
                                {previewIsPaused ? 'Click to Play' : 'Click to Pause'}
                              </p>
                              <p className="text-white/60 text-xs mt-1">
                                Preview Animation
                              </p>
                            </div>
                          </div>
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
  colors={${JSON.stringify(colors, null, 2).replace(/\n/g, '\n  ')}}
  speed={${speed}}
  blur={${blur}}
  opacity={${opacity}}
  respectReducedMotion={${respectReducedMotion}}
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
                
                {/* Navigation Buttons */}
                <div className="mt-12 flex justify-between items-center">
                  <Link 
                    href="/" 
                    className="group relative overflow-hidden bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg border border-white/30 dark:border-gray-600/30 hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all duration-200 flex items-center gap-2 text-sm shadow-lg hover:shadow-xl"
                  >
                    <span className="text-base transition-transform group-hover:-translate-x-1">←</span> 
                    <span>Back to Home</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </Link>
                  <a
                    href={ROUTES.api.download.animatedBackground}
                    className="group relative overflow-hidden bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm text-emerald-800 dark:text-emerald-200 font-medium py-2 px-4 rounded-lg border border-emerald-400/30 dark:border-emerald-500/30 hover:from-emerald-500/30 hover:to-teal-500/30 transition-all duration-200 flex items-center gap-2 text-sm shadow-lg hover:shadow-xl"
                  >
                    <span className="text-base transition-transform group-hover:translate-y-1">⬇</span> 
                    <span>Download Component</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        {/* Quick Actions Pane */}
        <div className="relative z-10 bg-white/10 dark:bg-gray-900/10 backdrop-blur-md border-t border-white/20 dark:border-gray-700/30 shadow-lg">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link 
                href="/curriculum" 
                className="group relative overflow-hidden bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm text-indigo-800 dark:text-indigo-200 font-medium py-3 px-4 rounded-lg border border-indigo-400/30 dark:border-indigo-500/30 hover:from-indigo-500/30 hover:to-purple-500/30 transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl"
              >
                <span className="text-base">📚</span>
                <span>Start Curriculum</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </Link>
              <Link 
                href="/interview-prep" 
                className="group relative overflow-hidden bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm text-emerald-800 dark:text-emerald-200 font-medium py-3 px-4 rounded-lg border border-emerald-400/30 dark:border-emerald-500/30 hover:from-emerald-500/30 hover:to-teal-500/30 transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl"
              >
                <span className="text-base">💼</span>
                <span>Interview Prep</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </Link>
              <Link 
                href="/playground" 
                className="group relative overflow-hidden bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm text-orange-800 dark:text-orange-200 font-medium py-3 px-4 rounded-lg border border-orange-400/30 dark:border-orange-500/30 hover:from-orange-500/30 hover:to-red-500/30 transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl"
              >
                <span className="text-base">🛠️</span>
                <span>Playground</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Color Scheme Editor Popup */}
      <ColorSchemeEditorPopup
        isOpen={isColorEditorOpen}
        onClose={() => setIsColorEditorOpen(false)}
        onColorsChange={setColors}
        initialColors={colors}
      />
    </div>
  );
}