'use client';

import { useTranslations } from 'next-intl';

export default function GlassLogo() {
  const t = useTranslations('site');
  
  return (
    <div 
      className="font-black text-xl md:text-2xl tracking-tight select-none inline-flex items-center"
      style={{
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif'
      }}
    >
      <span
        className="relative"
        style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
          backgroundSize: '200% 200%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 0 4px rgba(99, 102, 241, 0.3))',
          animation: 'gradientShift 3s ease infinite'
        }}
      >
        {t('title')}
      </span>
      
      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}