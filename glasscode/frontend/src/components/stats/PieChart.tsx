'use client';

import React, { useState } from 'react';

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function PieChart({ 
  data, 
  size = 200, 
  strokeWidth = 8,
  className = '' 
}: PieChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <div className="text-muted text-sm">No data</div>
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cumulativePercentage = 0;

  return (
    <div className={`flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8 ${className}`}>
      {/* Chart Container */}
      <div className="relative flex-shrink-0 mx-auto lg:mx-0">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={"hsl(var(--border) / 0.3)"}
            strokeWidth={strokeWidth}
          />
          
          {/* Data segments */}
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
            const isHovered = hoveredIndex === index;
            
            cumulativePercentage += percentage;
            
            return (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 2 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                style={{
                  filter: isHovered ? 'drop-shadow(0 0 8px hsl(var(--primary-fg) / 0.5))' : 'none',
                  opacity: hoveredIndex !== null && !isHovered ? 0.5 : 1
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {hoveredIndex !== null ? (
            <>
              <div className="text-2xl font-bold text-primary-fg">{data[hoveredIndex].value}</div>
              <div className="text-sm text-muted text-center px-2">{data[hoveredIndex].label}</div>
              <div className="text-xs text-muted mt-1">
                {((data[hoveredIndex].value / total) * 100).toFixed(1)}%
              </div>
            </>
          ) : (
            <>
              <div className="text-6xl font-bold text-primary-fg">{total}</div>
              <div className="text-sm text-muted">Total</div>
            </>
          )}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex-1 space-y-3 w-full lg:w-auto">
        {data.map((item, index) => {
          const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-3" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted font-medium">{item.label}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-fg font-bold">{item.value}</span>
                <span className="text-muted text-sm">({percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}