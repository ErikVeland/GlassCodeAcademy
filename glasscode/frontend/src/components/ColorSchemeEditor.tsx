"use client";

import React, { useState, useCallback } from "react";

interface ColorStop {
  id: string;
  color: string;
  position: number; // 0-100
}

interface ColorSchemeEditorProps {
  colors: string[];
  onColorsChange: (colors: string[]) => void;
  className?: string;
}

const ColorSchemeEditor: React.FC<ColorSchemeEditorProps> = ({
  colors,
  onColorsChange,
  className = "",
}) => {
  // Convert colors array to color stops with positions
  const [colorStops, setColorStops] = useState<ColorStop[]>(() => {
    return colors.map((color, index) => ({
      id: `color-${index}`,
      color,
      position: (index / (colors.length - 1)) * 100,
    }));
  });

  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  // Update parent component when color stops change
  const updateColors = useCallback(
    (stops: ColorStop[]) => {
      const sortedStops = [...stops].sort((a, b) => a.position - b.position);
      const newColors = sortedStops.map((stop) => stop.color);
      onColorsChange(newColors);
      setColorStops(sortedStops);
    },
    [onColorsChange],
  );

  // Add a new color stop
  const addColorStop = useCallback(() => {
    const newPosition =
      colorStops.length > 0
        ? Math.min(100, Math.max(...colorStops.map((s) => s.position)) + 20)
        : 50;

    const newStop: ColorStop = {
      id: `color-${Date.now()}`,
      color: "rgba(99, 102, 241, 0.12)", // Default indigo
      position: newPosition,
    };

    const newStops = [...colorStops, newStop];
    updateColors(newStops);
    setSelectedStopId(newStop.id);
  }, [colorStops, updateColors]);

  // Remove a color stop
  const removeColorStop = useCallback(
    (stopId: string) => {
      if (colorStops.length <= 2) return; // Keep at least 2 colors

      const newStops = colorStops.filter((stop) => stop.id !== stopId);
      updateColors(newStops);

      if (selectedStopId === stopId) {
        setSelectedStopId(null);
      }
    },
    [colorStops, selectedStopId, updateColors],
  );

  // Update color stop color
  const updateStopColor = useCallback(
    (stopId: string, newColor: string) => {
      const newStops = colorStops.map((stop) =>
        stop.id === stopId ? { ...stop, color: newColor } : stop,
      );
      updateColors(newStops);
    },
    [colorStops, updateColors],
  );

  // Update color stop position
  const updateStopPosition = useCallback(
    (stopId: string, newPosition: number) => {
      const clampedPosition = Math.max(0, Math.min(100, newPosition));
      const newStops = colorStops.map((stop) =>
        stop.id === stopId ? { ...stop, position: clampedPosition } : stop,
      );
      updateColors(newStops);
    },
    [colorStops, updateColors],
  );

  // Generate gradient preview
  const generateGradientPreview = useCallback(() => {
    const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);
    const gradientStops = sortedStops
      .map((stop) => `${stop.color} ${stop.position}%`)
      .join(", ");
    return `linear-gradient(45deg, ${gradientStops})`;
  }, [colorStops]);

  // Predefined color palette
  const colorPalette = [
    "rgba(99, 102, 241, 0.12)", // indigo
    "rgba(168, 85, 247, 0.12)", // purple
    "rgba(236, 72, 153, 0.12)", // pink
    "rgba(16, 185, 129, 0.12)", // green
    "rgba(245, 158, 11, 0.12)", // yellow
    "rgba(239, 68, 68, 0.12)", // red
    "rgba(59, 130, 246, 0.12)", // blue
    "rgba(139, 92, 246, 0.12)", // violet
    "rgba(251, 146, 60, 0.12)", // orange
    "rgba(14, 165, 233, 0.12)", // sky blue
    "rgba(192, 132, 252, 0.12)", // light purple
    "rgba(249, 115, 22, 0.12)", // orange-red
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Advanced Color Editor
        </h4>
        <div className="flex gap-2">
          <button
            onClick={addColorStop}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors duration-200"
            title="Add color stop"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add
          </button>
        </div>
      </div>

      {/* Gradient Preview */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Gradient Preview
        </label>
        <div
          className="w-full h-16 rounded-lg border-2 border-gray-200 dark:border-gray-600"
          style={{ background: generateGradientPreview() }}
        />
      </div>

      {/* Color Stops */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Color Stops ({colorStops.length})
        </label>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {colorStops.map((stop) => (
            <div
              key={stop.id}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors duration-200 ${
                selectedStopId === stop.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
              onClick={() => setSelectedStopId(stop.id)}
            >
              {/* Color Preview */}
              <div
                className="w-8 h-8 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                style={{ backgroundColor: stop.color }}
                title={`Color: ${stop.color}`}
              />

              {/* Position Control */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Position: {stop.position.toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={stop.position}
                  onChange={(e) =>
                    updateStopPosition(stop.id, parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Remove Button */}
              {colorStops.length > 2 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeColorStop(stop.id);
                  }}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                  title="Remove color stop"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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

      {/* Color Palette */}
      {selectedStopId && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Quick Colors
          </label>
          <div className="grid grid-cols-6 gap-2">
            {colorPalette.map((color, index) => (
              <button
                key={index}
                onClick={() => updateStopColor(selectedStopId, color)}
                className="w-8 h-8 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-200"
                style={{ backgroundColor: color }}
                title={`Apply color: ${color}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Selected Color Details */}
      {selectedStopId && (
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Edit Selected Color
          </label>
          <input
            type="text"
            value={colorStops.find((s) => s.id === selectedStopId)?.color || ""}
            onChange={(e) => updateStopColor(selectedStopId, e.target.value)}
            placeholder="rgba(99, 102, 241, 0.12)"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}
    </div>
  );
};

export default ColorSchemeEditor;
