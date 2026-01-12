"use client";

import React from "react";

type CircularProgressProps = {
  percent: number;
  size?: number; // diameter in px
  stroke?: number; // stroke width
  color?: string; // ring color
  trackColor?: string; // background ring
  className?: string;
};

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percent,
  size = 64,
  stroke = 6,
  color = "#3b82f6",
  trackColor = "#e5e7eb",
  className = "",
}) => {
  const radius = size / 2;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (Math.max(0, Math.min(percent, 100)) / 100) * circumference;

  return (
    <svg
      height={size}
      width={size}
      className={className}
      aria-label="progress"
      role="img"
    >
      <title>{`${Math.round(percent)}%`}</title>
      <circle
        stroke={trackColor}
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        style={{ strokeDashoffset, transition: "stroke-dashoffset 0.5s ease" }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy="0.3em"
        fontSize={size * 0.18}
        fill={color}
        fontWeight="bold"
      >
        {Math.round(percent)}%
      </text>
    </svg>
  );
};

export default CircularProgress;
