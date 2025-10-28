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
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  const saveAsAppBackground = () => {
    const backgroundSettings = {
      colors,
      speed,
      blur,
      opacity,
      respectReducedMotion
    };
    
    try {
      localStorage.setItem('appBackgroundSettings', JSON.stringify(backgroundSettings));
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to save background settings:', error);
    }
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
  return (
    <div className="min-h-screen relative">
      {/* Single AnimatedBackground for all states */}
      <AnimatedBackground 
        colors={colors}
        speed={speed}
        blur={blur}
        opacity={opacity}
        respectReducedMotion={respectReducedMotion}
        isPaused={isPaused}
      />
      <a href="#main-content" className="sr-only focus:absolute focus:p-4 focus:bg-surface focus:text-primary focus:ring-2 ring-focus ring-offset-2 ring-offset-bg z-50">
        Skip to main content
      </a>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Conditional Content Based on State */}
        {loading ? (
          <main id="main-content" className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            {retryCount > 0 ? (
              <div className="max-w-md mx-auto">
                <EnhancedLoadingComponent 
                  retryCount={retryCount} 
                  maxRetries={30} 
                  onRetry={handleManualRetry}
                />
              </div>
            ) : (
              <div className="max-w-3xl mx-auto">
                <div className="animate-pulse flex flex-col items-center justify-center space-y-4">
                  <div className="h-12 w-2/3 bg-surface-alt rounded border border-border"></div>
                  <div className="h-64 w-full bg-surface-alt rounded border border-border"></div>
                  <div className="h-10 w-1/3 bg-surface-alt rounded border border-border"></div>
                </div>
              </div>
            )}
          </main>
        ) : error ? (
          <main id="main-content" className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-3xl">
              <div className="bg-surface-alt backdrop-blur-sm rounded-xl shadow-lg p-6 border border-border">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-danger mb-4">Error</h2>
                  <p className="mb-4 text-fg">{error}</p>
                  <button
                    onClick={handleManualRetry}
                    className="btn bg-primary text-primary-fg ring-focus ring-offset-bg px-4 py-2 rounded-lg hover:opacity-90 transition-colors duration-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </main>
        ) : (
          /* Main Content */
          <main id="main-content" className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-3xl">
            <div className="group relative bg-surface-alt backdrop-blur-2xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-border overflow-hidden hover:shadow-[0_16px_48px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] transition-all duration-500 ease-out">
              {/* Enhanced liquid glass effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary-fg)/0.08)] via-[hsl(var(--primary-fg)/0.15)] to-[hsl(var(--primary-fg)/0.08)]"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(var(--primary-fg)/0.08)] to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary)/0.05)] via-transparent to-[hsl(var(--primary)/0.05)]"></div>
              
              {/* Enhanced glass reflection effect */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--primary-fg)/0.6)] to-transparent rounded-t-2xl"></div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--primary-fg)/0.3)] to-transparent"></div>
              <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[hsl(var(--primary-fg)/0.3)] to-transparent rounded-l-2xl"></div>
              <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[hsl(var(--primary-fg)/0.3)] to-transparent rounded-r-2xl"></div>
              
              <div className="relative p-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-fg mb-4">
                    Animated Background Component
                  </h2>
                  <p className="text-lg text-muted max-w-2xl mx-auto">
                    This demo showcases a reusable animated background component that can be customized with different colors, speeds, blur, and opacity.
                  </p>
                </div>



                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Controls */}
                  <div className="bg-surface-alt rounded-xl p-6 border border-border">
                    <h3 className="text-xl font-semibold text-fg mb-4">
                      Customization Controls
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="reduced-motion-toggle" className="block text-sm font-medium text-muted mb-2">
                          Respect Reduced Motion
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            id="reduced-motion-toggle"
                            type="checkbox"
                            checked={respectReducedMotion}
                            onChange={(e) => setRespectReducedMotion(e.target.checked)}
                            className="h-4 w-4 text-primary border-border rounded focus:ring-focus"
                          />
                          <span className="text-sm text-muted">
                            {respectReducedMotion ? 'Enabled' : 'Disabled (animation forced for demo)'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="speed-control" className="block text-sm font-medium text-muted mb-2">
                          Animation Speed: {speed}s
                        </label>
                        <input
                          id="speed-control"
                          type="range"
                          min="5"
                          max="60"
                          value={speed}
                          onChange={(e) => setSpeed(parseInt(e.target.value))}
                          className="w-full h-2 bg-surface-alt rounded-lg appearance-none cursor-pointer border border-border"
                          aria-label="Animation speed control"
                        />
                        <div className="flex justify-between text-xs text-muted mt-1">
                          <span>Fast</span>
                          <span>Slow</span>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="blur-control" className="block text-sm font-medium text-muted mb-2">
                          Blur: {blur}px
                        </label>
                        <input
                          id="blur-control"
                          type="range"
                          min="0"
                          max="100"
                          value={blur}
                          onChange={(e) => setBlur(parseInt(e.target.value))}
                          className="w-full h-2 bg-surface-alt rounded-lg appearance-none cursor-pointer border border-border"
                          aria-label="Blur effect control"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="opacity-control" className="block text-sm font-medium text-muted mb-2">
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
                          className="w-full h-2 bg-surface-alt rounded-lg appearance-none cursor-pointer border border-border"
                          aria-label="Background opacity control"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-8 space-y-4">
                      <button
                        onClick={() => setIsColorEditorOpen(true)}
                        className="w-full px-6 py-4 bg-surface-alt hover:bg-surface border border-border rounded-lg text-fg transition-colors duration-200 flex items-center justify-center group"
                      >
                        <div className="text-center">
                          <div className="text-lg font-medium">Advanced Color Editor</div>
                          <div className="text-sm text-muted">Create custom gradients with precise color control</div>
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
                            className="relative py-2 px-3 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:text-white transition-all duration-300 overflow-hidden group"
                            style={{
                              background: 'transparent'
                            }}
                            onMouseEnter={(e) => {
                              const gradientColors = preset.colors.map(color => {
                                const [r, g, b, a] = color.match(/\d+\.?\d*/g) || [];
                                return `rgba(${r}, ${g}, ${b}, ${a || 1})`;
                              });
                              e.currentTarget.style.background = `linear-gradient(135deg, ${gradientColors.join(', ')})`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                            aria-label={`Apply ${preset.name} color preset`}
                          >
                            <span className="relative z-10">{preset.name}</span>
                            <div 
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              style={{
                                background: `linear-gradient(135deg, ${preset.colors.map(color => {
                                  const [r, g, b, a] = color.match(/\d+\.?\d*/g) || [];
                                  return `rgba(${r}, ${g}, ${b}, ${a || 1})`;
                                }).join(', ')})`
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Preview */}
                  <div className="flex flex-col">
                    <div className="bg-surface rounded-xl p-6 flex-grow flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-fg">
                          Live Preview
                        </h3>
                        <button
                          onClick={() => setIsPaused(!isPaused)}
                          className="flex items-center gap-2 px-3 py-2 bg-surface-alt hover:bg-surface rounded-lg transition-colors duration-200 border border-border"
                          aria-label={isPaused ? "Play animation" : "Pause animation"}
                        >
                          {isPaused ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-fg" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-fg" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                            </svg>
                          )}
                          <span className="text-primary-fg text-sm">
                            {isPaused ? 'Play' : 'Pause'}
                          </span>
                        </button>
                      </div>
                      
                      {/* Minimized Animation Preview */}
                      <div className="flex-grow flex items-center justify-center">
                        <div 
                          onClick={() => setPreviewIsPaused(!previewIsPaused)}
                          className={`relative w-64 h-40 rounded-lg overflow-hidden border-2 border-border transition-all duration-500 cursor-pointer hover:opacity-90 ${
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
                              <div className="inline-block p-3 rounded-full bg-surface-alt backdrop-blur-sm mb-2 border border-border">
                                {previewIsPaused ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-fg" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-fg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                )}
                              </div>
                              <p className="text-[hsl(var(--primary-fg)/0.8)] text-sm font-medium">
                                {previewIsPaused ? 'Click to Play' : 'Click to Pause'}
                              </p>
                              <p className="text-[hsl(var(--primary-fg)/0.6)] text-xs mt-1">
                                Preview Animation
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 bg-surface-alt rounded-xl p-6 border border-border">
                      <h3 className="text-lg font-medium text-fg mb-2">
                        Implementation
                      </h3>
                      <p className="text-muted text-sm mb-3">
                        To use this component in your pages:
                      </p>
                      <pre className="bg-surface text-fg p-3 rounded-lg text-xs overflow-x-auto border border-border">
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
                  <p className="text-muted">
                    This animated background component can be used on any page to create a sophisticated, 
                    customizable background effect that enhances the visual appeal of your application.
                  </p>
                </div>
                
                {/* Navigation Buttons */}
                <div className="mt-12 flex justify-center items-center gap-4 flex-wrap">
                  <Link 
                    href="/" 
                    className="group relative overflow-hidden bg-surface-alt backdrop-blur-sm text-fg font-medium py-2 px-4 rounded-lg border border-border hover:bg-surface transition-all duration-200 flex items-center gap-2 text-sm shadow-lg hover:shadow-xl"
                  >
                    <span className="text-base transition-transform group-hover:-translate-x-1">←</span> 
                    <span>Back to Home</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(var(--primary-fg)/0.1)] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </Link>
                  
                  <button
                    onClick={saveAsAppBackground}
                    className="group relative overflow-hidden bg-[hsl(var(--primary)/0.1)] backdrop-blur-sm text-primary font-medium py-2 px-4 rounded-lg border border-border hover:bg-[hsl(var(--primary)/0.15)] transition-all duration-200 flex items-center gap-2 text-sm shadow-lg hover:shadow-xl"
                  >
                    <span className="text-base">💾</span> 
                    <span>Use as App Background</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(var(--primary-fg)/0.1)] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    {saveSuccess && (
                      <div className="absolute inset-0 bg-[hsl(var(--success)/0.4)] rounded-lg flex items-center justify-center">
                        <div className="text-primary-fg font-medium flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Saved!
                        </div>
                      </div>
                    )}
                  </button>
                  
                  <a
                    href={`${ROUTES.api.download.animatedBackground}?colors=${encodeURIComponent(JSON.stringify(colors))}&speed=${speed}&blur=${blur}&opacity=${opacity}&respectReducedMotion=${respectReducedMotion}`}
                    className="group relative overflow-hidden bg-[hsl(var(--primary)/0.1)] backdrop-blur-sm text-primary font-medium py-2 px-4 rounded-lg border border-border hover:bg-[hsl(var(--primary)/0.15)] transition-all duration-200 flex items-center gap-2 text-sm shadow-lg hover:shadow-xl"
                  >
                    <span className="text-base transition-transform group-hover:translate-y-1">⬇</span> 
                    <span>Download Component</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(var(--primary-fg)/0.1)] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>
        )}
        
        {/* Quick Actions Pane */}
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="group relative bg-surface-alt backdrop-blur-2xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-border overflow-hidden hover:shadow-[0_16px_48px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] transition-all duration-500 ease-out">
            {/* Enhanced liquid glass effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary-fg)/0.08)] via-[hsl(var(--primary-fg)/0.15)] to-[hsl(var(--primary-fg)/0.08)]"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(var(--primary-fg)/0.08)] to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary)/0.05)] via-transparent to-[hsl(var(--primary)/0.05)]"></div>
            
            {/* Enhanced glass reflection effect */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--primary-fg)/0.6)] to-transparent rounded-t-2xl"></div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--primary-fg)/0.3)] to-transparent"></div>
            <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[hsl(var(--primary-fg)/0.3)] to-transparent rounded-l-2xl"></div>
            <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[hsl(var(--primary-fg)/0.3)] to-transparent rounded-r-2xl"></div>
            
            <div className="relative py-6 px-6">
            <h3 className="text-lg font-semibold text-fg mb-4 text-center">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link 
                href="/curriculum" 
                className="group relative overflow-hidden bg-surface-alt backdrop-blur-lg text-fg font-medium py-3 px-4 rounded-2xl border border-border hover:bg-surface transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-2xl"
              >
                <span className="text-base">📚</span>
                <span>Start Curriculum</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </Link>
              <Link 
                href="/interview-prep" 
                className="group relative overflow-hidden bg-surface-alt backdrop-blur-lg text-fg font-medium py-3 px-4 rounded-2xl border border-border hover:bg-surface transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-2xl"
              >
                <span className="text-base">💼</span>
                <span>Interview Prep</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </Link>
              <Link 
                href="/playground" 
                className="group relative overflow-hidden bg-surface-alt backdrop-blur-lg text-fg font-medium py-3 px-4 rounded-2xl border border-border hover:bg-surface transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-2xl"
              >
                <span className="text-base">🛠️</span>
                <span>Playground</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </Link>
            </div>
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