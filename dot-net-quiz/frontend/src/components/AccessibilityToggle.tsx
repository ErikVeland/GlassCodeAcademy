'use client';

import React, { useState, useEffect } from 'react';
import { useAccessibility } from './AccessibilityProvider';

const AccessibilityToggle: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSetting } = useAccessibility();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Option + A (Mac) or Ctrl + Alt + A (Windows) to toggle panel
      if ((e.ctrlKey && e.altKey) || (e.ctrlKey && e.metaKey)) {
        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          setIsOpen(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Accessibility settings"
        aria-expanded={isOpen}
        className="accessibility-toggle"
        data-testid="accessibility-toggle"
      >
        <span className="accessibility-icon" aria-hidden="true">♿</span>
        <span className="accessibility-label">Accessibility</span>
      </button>

      {isOpen && (
        <div 
          className="accessibility-panel-overlay"
          role="dialog"
          aria-labelledby="accessibility-panel-title"
          aria-modal="true"
        >
          <div className="accessibility-panel" role="document">
            <div className="accessibility-panel-header">
              <h2 id="accessibility-panel-title">Accessibility Settings</h2>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close accessibility settings"
                className="close-button"
              >
                ×
              </button>
            </div>
            
            <div className="accessibility-panel-body">
              <div className="setting-group">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={settings.highContrast}
                    onChange={(e) => updateSetting('highContrast', e.target.checked)}
                    aria-describedby="high-contrast-help"
                  />
                  <span className="setting-text">High Contrast Mode</span>
                </label>
                <p id="high-contrast-help" className="setting-help">
                  Increases contrast for better visibility
                </p>
              </div>
              
              <div className="setting-group">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={settings.reducedMotion}
                    onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
                    aria-describedby="reduced-motion-help"
                  />
                  <span className="setting-text">Reduce Motion</span>
                </label>
                <p id="reduced-motion-help" className="setting-help">
                  Minimizes animations and transitions
                </p>
              </div>
              
              <div className="setting-group">
                <label htmlFor="text-size-select" className="setting-label">
                  Text Size:
                </label>
                <select
                  id="text-size-select"
                  value={settings.textSize}
                  onChange={(e) => updateSetting('textSize', e.target.value)}
                  aria-describedby="text-size-help"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </select>
                <p id="text-size-help" className="setting-help">
                  Adjust text size for better readability
                </p>
              </div>
              
              <div className="setting-group">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={settings.screenReaderOptimized}
                    onChange={(e) => updateSetting('screenReaderOptimized', e.target.checked)}
                    aria-describedby="screen-reader-help"
                  />
                  <span className="setting-text">Screen Reader Optimization</span>
                </label>
                <p id="screen-reader-help" className="setting-help">
                  Optimizes content for screen readers
                </p>
              </div>
              
              <div className="setting-group">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={settings.focusIndicators}
                    onChange={(e) => updateSetting('focusIndicators', e.target.checked)}
                    aria-describedby="focus-indicators-help"
                  />
                  <span className="setting-text">Enhanced Focus Indicators</span>
                </label>
                <p id="focus-indicators-help" className="setting-help">
                  Improves visibility of keyboard focus
                </p>
              </div>
            </div>
            
            <div className="accessibility-panel-footer">
              <button 
                onClick={() => {
                  updateSetting('highContrast', false);
                  updateSetting('reducedMotion', false);
                  updateSetting('textSize', 'medium');
                  updateSetting('screenReaderOptimized', false);
                  updateSetting('focusIndicators', true);
                }}
                className="reset-button"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .accessibility-toggle {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
        }
        
        .accessibility-toggle:hover,
        .accessibility-toggle:focus {
          background: #4338ca;
          transform: scale(1.1);
          outline: 3px solid #005fcc;
          outline-offset: 2px;
        }
        
        .accessibility-icon {
          font-size: 24px;
          margin-bottom: 2px;
        }
        
        .accessibility-label {
          font-size: 10px;
          font-weight: bold;
        }
        
        .accessibility-panel-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1001;
        }
        
        .accessibility-panel {
          background: white;
          border-radius: 8px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        
        .accessibility-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #e0e0e0;
          background: #f8fafc;
        }
        
        .accessibility-panel-header h2 {
          margin: 0;
          color: #1e293b;
          font-size: 1.25rem;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.25rem;
          color: #64748b;
          border-radius: 4px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .close-button:hover,
        .close-button:focus {
          background: #f1f5f9;
          outline: 2px solid #005fcc;
          outline-offset: 2px;
        }
        
        .accessibility-panel-body {
          padding: 1rem;
        }
        
        .setting-group {
          margin-bottom: 1.5rem;
        }
        
        .setting-label {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #1e293b;
        }
        
        .setting-label input[type="checkbox"] {
          margin-right: 0.75rem;
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        
        .setting-text {
          cursor: pointer;
        }
        
        .setting-help {
          margin: 0.25rem 0 0 0;
          font-size: 0.875rem;
          color: #64748b;
        }
        
        .setting-group select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          background: white;
          font-size: 1rem;
          color: #1e293b;
        }
        
        .setting-group select:focus {
          outline: 2px solid #005fcc;
          outline-offset: 2px;
          border-color: #94a3b8;
        }
        
        .accessibility-panel-footer {
          padding: 1rem;
          border-top: 1px solid #e0e0e0;
          background: #f8fafc;
          text-align: right;
        }
        
        .reset-button {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          color: #1e293b;
        }
        
        .reset-button:hover,
        .reset-button:focus {
          background: #e2e8f0;
          outline: 2px solid #005fcc;
          outline-offset: 2px;
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
          .accessibility-toggle {
            width: 50px;
            height: 50px;
            bottom: 15px;
            right: 15px;
          }
          
          .accessibility-icon {
            font-size: 20px;
          }
          
          .accessibility-label {
            font-size: 8px;
          }
        }
      `}</style>
    </>
  );
};

export default AccessibilityToggle;