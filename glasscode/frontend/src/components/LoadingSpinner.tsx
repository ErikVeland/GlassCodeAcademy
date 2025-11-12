"use client";

import React from "react";

interface LoadingSpinnerProps {
  message?: string;
  moduleName?: string;
  size?: "sm" | "md" | "lg";
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Loading your learning content...",
  moduleName,
  size = "md",
}) => {
  // Contextual message
  const displayMessage = moduleName
    ? `Loading ${moduleName} content...`
    : message;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 dark:border-gray-700/50">
      <div className="mb-6 flex justify-center">
        {/* SVG-based spinner with three rotating elements */}
        <div
          className="relative"
          style={{
            height: size === "sm" ? 32 : size === "md" ? 64 : 96,
            width: size === "sm" ? 32 : size === "md" ? 64 : 96,
          }}
        >
          <svg
            viewBox={`0 0 ${size === "sm" ? 32 : size === "md" ? 64 : 96} ${size === "sm" ? 32 : size === "md" ? 64 : 96}`}
            className="animate-spin"
            style={{ animationDuration: "2s" }}
          >
            {/* Circle 1: Course content (book icon) */}
            <circle
              cx={size === "sm" ? 16 : size === "md" ? 32 : 48}
              cy={size === "sm" ? 16 : size === "md" ? 32 : 48}
              r={size === "sm" ? 12 : size === "md" ? 28 : 44}
              stroke="#3B82F6"
              strokeWidth="3"
              fill="none"
              strokeDasharray="60 90"
              strokeLinecap="round"
              opacity="0.8"
            />

            {/* Circle 2: Interactive lessons (lightbulb icon) */}
            <circle
              cx={size === "sm" ? 16 : size === "md" ? 32 : 48}
              cy={size === "sm" ? 16 : size === "md" ? 32 : 48}
              r={size === "sm" ? 8 : size === "md" ? 20 : 32}
              stroke="#10B981"
              strokeWidth="3"
              fill="none"
              strokeDasharray="40 110"
              strokeLinecap="round"
              opacity="0.8"
              style={{ animationDelay: "0.3s" }}
            />

            {/* Circle 3: Quiz challenges (question mark icon) */}
            <circle
              cx={size === "sm" ? 16 : size === "md" ? 32 : 48}
              cy={size === "sm" ? 16 : size === "md" ? 32 : 48}
              r={size === "sm" ? 4 : size === "md" ? 12 : 20}
              stroke="#8B5CF6"
              strokeWidth="3"
              fill="none"
              strokeDasharray="20 130"
              strokeLinecap="round"
              opacity="0.8"
              style={{ animationDelay: "0.6s" }}
            />

            {/* Center icon representing learning */}
            <circle
              cx={size === "sm" ? 16 : size === "md" ? 32 : 48}
              cy={size === "sm" ? 16 : size === "md" ? 32 : 48}
              r="4"
              fill="#4F46E5"
              className="animate-pulse"
            />
          </svg>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
        {displayMessage}
      </h2>

      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
        We&apos;re preparing your personalized learning experience. This may
        take a moment.
      </p>

      <div className="mt-6 flex space-x-2">
        <div className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce"></div>
        <div
          className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        ></div>
        <div
          className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce"
          style={{ animationDelay: "0.4s" }}
        ></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
