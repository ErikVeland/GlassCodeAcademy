'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// WCAG 2.1 AA Compliance Features Interface
interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  textSize: 'small' | 'medium' | 'large' | 'extra-large';
  focusIndicators: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: (key: keyof AccessibilitySettings, value: any) => void;
  resetSettings: () => void;
  announceToScreenReader: (message: string) => void;
  trapFocus: (container: HTMLElement) => () => void;
  skipToContent: () => void;
  getCurrentHeadingLevel: () => number;
  setCurrentHeadingLevel: (level: number) => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  textSize: 'medium',
  focusIndicators: true,
  screenReaderOptimized: false,
  keyboardNavigation: true,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [currentHeadingLevel, setCurrentHeadingLevel] = useState(1);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.warn('Failed to parse accessibility settings:', error);
      }
    }

    // Check for system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

    if (prefersReducedMotion || prefersHighContrast) {
      setSettings(prev => ({
        ...prev,
        reducedMotion: prefersReducedMotion || prev.reducedMotion,
        highContrast: prefersHighContrast || prev.highContrast,
      }));
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast mode
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Text size
    root.setAttribute('data-text-size', settings.textSize);

    // Focus indicators
    if (settings.focusIndicators) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }

    // Screen reader optimization
    if (settings.screenReaderOptimized) {
      root.classList.add('screen-reader-optimized');
    } else {
      root.classList.remove('screen-reader-optimized');
    }
  }, [settings]);

  const updateSetting = useCallback((key: keyof AccessibilitySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  // Screen reader announcements
  const announceToScreenReader = useCallback((message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  // Focus trap for modals and dropdowns
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  // Skip to main content
  const skipToContent = useCallback(() => {
    const mainContent = document.getElementById('main-content') || 
                       document.querySelector('main') ||
                       document.querySelector('[role="main"]');
    
    if (mainContent) {
      (mainContent as HTMLElement).focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const contextValue: AccessibilityContextType = {
    settings,
    updateSetting,
    resetSettings,
    announceToScreenReader,
    trapFocus,
    skipToContent,
    getCurrentHeadingLevel: () => currentHeadingLevel,
    setCurrentHeadingLevel,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="skip-to-content"
        onClick={(e) => {
          e.preventDefault();
          skipToContent();
        }}
      >
        Skip to main content
      </a>
      
      {children}
      
      {/* Global accessibility styles */}
      <style jsx global>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        
        /* High contrast mode */
        .high-contrast {
          --bg-primary: #000;
          --text-primary: #fff;
          --bg-secondary: #1a1a1a;
          --text-secondary: #e0e0e0;
          --accent-primary: #ffff00;
          --accent-secondary: #00ffff;
          --border-color: #fff;
        }
        
        /* Reduced motion */
        .reduced-motion *,
        .reduced-motion *::before,
        .reduced-motion *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
        
        /* Enhanced focus indicators */
        .enhanced-focus *:focus {
          outline: 3px solid #005fcc;
          outline-offset: 2px;
        }
        
        /* Text size adjustments */
        [data-text-size="small"] {
          font-size: 0.875rem;
        }
        
        [data-text-size="medium"] {
          font-size: 1rem;
        }
        
        [data-text-size="large"] {
          font-size: 1.125rem;
        }
        
        [data-text-size="extra-large"] {
          font-size: 1.25rem;
        }
        
        /* Screen reader optimizations */
        .screen-reader-optimized {
          --animation-duration: 0s;
          --transition-duration: 0s;
        }
        
        .screen-reader-optimized .decorative {
          display: none;
        }
        
        /* Keyboard navigation improvements */
        .keyboard-navigation button:focus,
        .keyboard-navigation a:focus,
        .keyboard-navigation input:focus,
        .keyboard-navigation select:focus,
        .keyboard-navigation textarea:focus {
          box-shadow: 0 0 0 3px rgba(0, 95, 204, 0.3);
        }
      `}</style>
    </AccessibilityContext.Provider>
  );
};

// Accessibility settings panel component
export const AccessibilityPanel: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { settings, updateSetting, resetSettings, announceToScreenReader } = useAccessibility();

  if (!isOpen) return null;

  const handleSettingChange = (key: keyof AccessibilitySettings, value: any) => {
    updateSetting(key, value);
    announceToScreenReader(`${key} setting updated`);
  };

  return (
    <div
      role="dialog"
      aria-labelledby="accessibility-panel-title"
      aria-modal="true"
      className="accessibility-panel"
    >
      <div className="accessibility-panel-content">
        <header className="accessibility-panel-header">
          <h2 id="accessibility-panel-title">Accessibility Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close accessibility settings"
            className="close-button"
          >
            ×
          </button>
        </header>
        
        <div className="accessibility-panel-body">
          <div className="setting-group">
            <label>
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => handleSettingChange('highContrast', e.target.checked)}
              />
              High Contrast Mode
            </label>
          </div>
          
          <div className="setting-group">
            <label>
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => handleSettingChange('reducedMotion', e.target.checked)}
              />
              Reduce Motion
            </label>
          </div>
          
          <div className="setting-group">
            <label htmlFor="text-size-select">Text Size:</label>
            <select
              id="text-size-select"
              value={settings.textSize}
              onChange={(e) => handleSettingChange('textSize', e.target.value)}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="extra-large">Extra Large</option>
            </select>
          </div>
          
          <div className="setting-group">
            <label>
              <input
                type="checkbox"
                checked={settings.screenReaderOptimized}
                onChange={(e) => handleSettingChange('screenReaderOptimized', e.target.checked)}
              />
              Screen Reader Optimization
            </label>
          </div>
          
          <div className="setting-group">
            <label>
              <input
                type="checkbox"
                checked={settings.focusIndicators}
                onChange={(e) => handleSettingChange('focusIndicators', e.target.checked)}
              />
              Enhanced Focus Indicators
            </label>
          </div>
        </div>
        
        <footer className="accessibility-panel-footer">
          <button onClick={resetSettings} className="reset-button">
            Reset to Defaults
          </button>
        </footer>
      </div>
      
      <style jsx>{`
        .accessibility-panel {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .accessibility-panel-content {
          background: white;
          border-radius: 8px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .accessibility-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.25rem;
        }
        
        .accessibility-panel-body {
          padding: 1rem;
        }
        
        .setting-group {
          margin-bottom: 1rem;
        }
        
        .setting-group label {
          display: block;
          margin-bottom: 0.5rem;
        }
        
        .setting-group input[type="checkbox"] {
          margin-right: 0.5rem;
        }
        
        .setting-group select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        
        .accessibility-panel-footer {
          padding: 1rem;
          border-top: 1px solid #e0e0e0;
          text-align: right;
        }
        
        .reset-button {
          background: #f0f0f0;
          border: 1px solid #ccc;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .reset-button:hover {
          background: #e0e0e0;
        }
      `}</style>
    </div>
  );
};