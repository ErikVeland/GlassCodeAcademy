"use client";

import React from "react";
import { LessonSource } from "../lib/sourcesUtils";

interface SourcesProps {
  sources: LessonSource[];
  title?: string;
  className?: string;
  variant?: "card" | "inline" | "compact";
}

const Sources: React.FC<SourcesProps> = ({
  sources,
  title = "Further Reading",
  className = "",
  variant = "card",
}) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  const baseClasses = "sources-container";
  const variantClasses = {
    card: "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6",
    inline:
      "bg-gray-50/90 dark:bg-gray-700/90 rounded-lg p-4 border border-gray-200 dark:border-gray-600",
    compact: "bg-transparent",
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="text-blue-500">📚</span>
        {title}
      </h3>

      <div className="space-y-3">
        {sources.map((source, index) => (
          <a
            key={index}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-200">
              <div className="flex-shrink-0 mt-1">
                <svg
                  className="w-4 h-4 text-blue-500 group-hover:text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {source.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {source.url}
                </p>
              </div>

              <div className="flex-shrink-0">
                <svg
                  className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </a>
        ))}
      </div>

      {sources.length > 0 && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          💡 These resources complement your interview preparation
        </div>
      )}
    </div>
  );
};

export default Sources;
