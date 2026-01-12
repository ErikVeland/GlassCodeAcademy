"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAccessibility } from "./AccessibilityProvider";
import { usePathname } from "next/navigation";

const AccessibilityToggle: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSetting } = useAccessibility();
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Option + A (Mac) or Ctrl + Alt + A (Windows) to toggle panel
      if ((e.ctrlKey && e.altKey) || (e.ctrlKey && e.metaKey)) {
        if (e.key === "a" || e.key === "A") {
          e.preventDefault();
          setIsOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close panel on route change to avoid lingering overlays
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Focus overlay when opened for Escape key handling
  useEffect(() => {
    if (isOpen) {
      overlayRef.current?.focus();
    }
  }, [isOpen]);

  // Handle Escape key when overlay is focused
  const handleOverlayKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Accessibility settings"
        aria-expanded={isOpen}
        className="accessibility-toggle focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg"
        data-testid="accessibility-toggle"
      >
        <span className="accessibility-icon" aria-hidden="true">
          ♿
        </span>
        <span className="accessibility-label">Accessibility</span>
      </button>

      {isOpen && (
        <div
          className="accessibility-panel-overlay"
          role="dialog"
          aria-labelledby="accessibility-panel-title"
          aria-modal="true"
          onClick={() => setIsOpen(false)}
          onKeyDown={handleOverlayKeyDown}
          tabIndex={-1}
          ref={overlayRef}
        >
          <div
            className="accessibility-panel"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="accessibility-panel-header">
              <h2 id="accessibility-panel-title">Accessibility Settings</h2>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close accessibility settings"
                className="close-button focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg"
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
                    onChange={(e) =>
                      updateSetting("highContrast", e.target.checked)
                    }
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
                    onChange={(e) =>
                      updateSetting("reducedMotion", e.target.checked)
                    }
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
                  onChange={(e) =>
                    updateSetting(
                      "textSize",
                      e.target.value as typeof settings.textSize,
                    )
                  }
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
                    onChange={(e) =>
                      updateSetting("screenReaderOptimized", e.target.checked)
                    }
                    aria-describedby="screen-reader-help"
                  />
                  <span className="setting-text">
                    Screen Reader Optimization
                  </span>
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
                    onChange={(e) =>
                      updateSetting("focusIndicators", e.target.checked)
                    }
                    aria-describedby="focus-indicators-help"
                  />
                  <span className="setting-text">
                    Enhanced Focus Indicators
                  </span>
                </label>
                <p id="focus-indicators-help" className="setting-help">
                  Improves visibility of keyboard focus
                </p>
              </div>
            </div>

            <div className="accessibility-panel-footer">
              <button
                onClick={() => {
                  updateSetting("highContrast", false);
                  updateSetting("reducedMotion", false);
                  updateSetting("textSize", "medium");
                  updateSetting("screenReaderOptimized", false);
                  updateSetting("focusIndicators", true);
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
          background: hsl(var(--primary));
          color: hsl(var(--primary-fg));
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
          background: hsl(var(--primary));
          transform: scale(1.1);
          outline: none;
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
          background: hsl(var(--surface));
          color: hsl(var(--fg));
          border-radius: 8px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          border: 1px solid hsl(var(--border));
        }

        .accessibility-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--surface-alt));
        }

        .accessibility-panel-header h2 {
          margin: 0;
          color: hsl(var(--fg));
          font-size: 1.25rem;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.25rem;
          color: hsl(var(--muted));
          border-radius: 4px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover,
        .close-button:focus {
          background: hsl(var(--surface-alt));
          outline: none;
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
          color: hsl(var(--fg));
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
          color: hsl(var(--muted));
        }

        .setting-group select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid hsl(var(--border));
          border-radius: 4px;
          background: hsl(var(--surface));
          font-size: 1rem;
          color: hsl(var(--fg));
        }

        .setting-group select:focus {
          outline: 2px solid hsl(var(--ring-focus));
          outline-offset: 2px;
          border-color: hsl(var(--border));
        }

        .accessibility-panel-footer {
          padding: 1rem;
          border-top: 1px solid hsl(var(--border));
          background: hsl(var(--surface-alt));
          text-align: right;
        }

        .reset-button {
          background: hsl(var(--surface-alt));
          border: 1px solid hsl(var(--border));
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          color: hsl(var(--fg));
        }

        .reset-button:hover,
        .reset-button:focus {
          background: hsl(var(--surface-alt));
          filter: brightness(0.95);
          outline: 2px solid hsl(var(--ring-focus));
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
