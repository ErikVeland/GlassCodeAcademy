'use client';

import { useTranslations } from 'next-intl';

export default function GlassLogo() {
  const t = useTranslations('site');
  
  return (
    <div className="flex items-center gap-2">
      {/* Custom Glass Academy Logo */}
      <div className="relative w-8 h-8 flex items-center justify-center">
        {/* Glass prism effect */}
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full absolute inset-0"
          style={{
            filter: 'drop-shadow(0 0 4px rgba(99, 102, 241, 0.3))'
          }}
        >
          {/* Main glass prism */}
          <polygon 
            points="50,10 80,30 70,70 30,70 20,30" 
            className="glass-prism"
            style={{
              fill: 'url(#prismGradient)',
              stroke: 'rgba(99, 102, 241, 0.2)',
              strokeWidth: 1
            }}
          />
          
          {/* Light reflection */}
          <polygon 
            points="50,15 75,32 68,65 32,65 25,32" 
            className="glass-reflection"
            style={{
              fill: 'rgba(255, 255, 255, 0.3)',
            }}
          />
          
          {/* Inner glow */}
          <polygon 
            points="50,10 80,30 70,70 30,70 20,30" 
            className="glass-glow"
            style={{
              fill: 'none',
              stroke: 'rgba(139, 92, 246, 0.4)',
              strokeWidth: 2,
              filter: 'blur(2px)'
            }}
          />
          
          <defs>
            <linearGradient id="prismGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="25%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="75%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Animated particles */}
        <div className="absolute inset-0 particle-container">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white particle"
              style={{
                top: `${20 + i * 20}%`,
                left: `${30 + i * 15}%`,
                animation: `particleFloat ${3 + i}s ease-in-out infinite`,
                opacity: 0.7,
                filter: 'blur(0.5px)'
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Text logo with enhanced typography - NO LINE BREAK */}
      <div 
        className="font-black text-xl md:text-2xl tracking-tight select-none relative whitespace-nowrap"
        style={{
          fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
          backgroundSize: '200% 200%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}
      >
        {t('title')}
        <style jsx>{`
          @keyframes particleFloat {
            0% { transform: translateY(0) translateX(0); opacity: 0; }
            50% { opacity: 0.7; }
            100% { transform: translateY(-10px) translateX(5px); opacity: 0; }
          }
          
          .glass-prism {
            animation: prismRotate 12s ease-in-out infinite;
            transform-origin: center;
          }
          
          .glass-reflection {
            animation: reflectionGlow 4s ease-in-out infinite;
          }
          
          .glass-glow {
            animation: outerGlow 3s ease-in-out infinite;
          }
          
          @keyframes prismRotate {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(2deg); }
            50% { transform: rotate(0deg); }
            75% { transform: rotate(-2deg); }
            100% { transform: rotate(0deg); }
          }
          
          @keyframes reflectionGlow {
            0% { opacity: 0.3; }
            50% { opacity: 0.6; }
            100% { opacity: 0.3; }
          }
          
          @keyframes outerGlow {
            0% { opacity: 0.4; }
            50% { opacity: 0.8; }
            100% { opacity: 0.4; }
          }
        `}</style>
      </div>
    </div>
  );
}