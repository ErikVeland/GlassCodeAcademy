"use client";

import React, { useState, useCallback } from "react";

interface ColorStop {
  color: string;
  position: number;
}

interface ColorSchemeEditorPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onColorsChange: (colors: string[]) => void;
  initialColors?: string[];
}

const ColorSchemeEditorPopup: React.FC<ColorSchemeEditorPopupProps> = ({
  isOpen,
  onClose,
  onColorsChange,
  initialColors = [
    "rgba(99, 102, 241, 0.12)",
    "rgba(168, 85, 247, 0.12)",
    "rgba(236, 72, 153, 0.12)",
    "rgba(16, 185, 129, 0.12)",
  ],
}) => {
  const [colorStops, setColorStops] = useState<ColorStop[]>(() => {
    return initialColors.map((color, index) => ({
      color,
      position: (index / (initialColors.length - 1)) * 100,
    }));
  });

  const updateColor = useCallback(
    (index: number, newColor: string) => {
      setColorStops((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], color: newColor };
        const colors = updated.map((stop) => stop.color);
        onColorsChange(colors);
        return updated;
      });
    },
    [onColorsChange],
  );

  const updatePosition = useCallback(
    (index: number, newPosition: number) => {
      setColorStops((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          position: Math.max(0, Math.min(100, newPosition)),
        };
        // Sort by position to maintain gradient order
        updated.sort((a, b) => a.position - b.position);
        const colors = updated.map((stop) => stop.color);
        onColorsChange(colors);
        return updated;
      });
    },
    [onColorsChange],
  );

  const addColorStop = useCallback(() => {
    setColorStops((prev) => {
      const newPosition =
        prev.length > 0 ? Math.max(...prev.map((s) => s.position)) + 10 : 0;
      const updated = [
        ...prev,
        {
          color: "rgba(59, 130, 246, 0.12)",
          position: Math.min(100, newPosition),
        },
      ];
      const colors = updated.map((stop) => stop.color);
      onColorsChange(colors);
      return updated;
    });
  }, [onColorsChange]);

  const removeColorStop = useCallback(
    (index: number) => {
      if (colorStops.length <= 2) return; // Keep at least 2 colors

      setColorStops((prev) => {
        const updated = prev.filter((_, i) => i !== index);
        const colors = updated.map((stop) => stop.color);
        onColorsChange(colors);
        return updated;
      });
    },
    [colorStops.length, onColorsChange],
  );

  const extractColorValue = (colorString: string): string => {
    const rgbaMatch = colorString.match(/rgba?\(([^)]+)\)/);
    if (rgbaMatch) {
      const values = rgbaMatch[1].split(",").map((v) => v.trim());
      if (values.length >= 3) {
        const r = parseInt(values[0]);
        const g = parseInt(values[1]);
        const b = parseInt(values[2]);
        return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
      }
    }
    return "#000000";
  };

  const createRgbaFromHex = (hex: string, alpha: number = 0.12): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">
            Color Scheme Editor
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* Gradient Preview */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white/80 mb-3">Preview</h3>
            <div
              className="h-20 rounded-lg border border-white/20"
              style={{
                background: `linear-gradient(45deg, ${colorStops.map((stop) => stop.color).join(", ")})`,
                backgroundSize: "200% 200%",
                animation: "gradient-shift 3s ease infinite",
              }}
            />
          </div>

          {/* Color Stops */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/80">Color Stops</h3>
              <button
                onClick={addColorStop}
                className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-blue-200 text-sm transition-colors"
              >
                Add Color
              </button>
            </div>

            <div className="space-y-4">
              {colorStops.map((stop, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  {/* Color Picker */}
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={extractColorValue(stop.color)}
                      onChange={(e) =>
                        updateColor(index, createRgbaFromHex(e.target.value))
                      }
                      className="w-10 h-10 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs text-white/60">
                        Color {index + 1}
                      </span>
                      <span className="text-xs text-white/40 font-mono">
                        {stop.color}
                      </span>
                    </div>
                  </div>

                  {/* Position Slider */}
                  <div className="flex-1">
                    <label className="text-xs text-white/60 mb-1 block">
                      Position: {stop.position.toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={stop.position}
                      onChange={(e) =>
                        updatePosition(index, parseFloat(e.target.value))
                      }
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  {/* Remove Button */}
                  {colorStops.length > 2 && (
                    <button
                      onClick={() => removeColorStop(index)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Gradient Controls */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/80">
              Gradient Controls
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  const sorted = [...colorStops].sort(
                    (a, b) => a.position - b.position,
                  );
                  setColorStops(sorted);
                  onColorsChange(sorted.map((stop) => stop.color));
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white/80 text-sm transition-colors"
              >
                Sort by Position
              </button>

              <button
                onClick={() => {
                  const redistributed = colorStops.map((stop, index) => ({
                    ...stop,
                    position: (index / (colorStops.length - 1)) * 100,
                  }));
                  setColorStops(redistributed);
                  onColorsChange(redistributed.map((stop) => stop.color));
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white/80 text-sm transition-colors"
              >
                Redistribute Evenly
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient-shift {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid white;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid white;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default ColorSchemeEditorPopup;
