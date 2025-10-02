'use client';

import React from 'react';
import '../../styles/liquid-glass.scss';

const TestGlassmorphismPage: React.FC = () => {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Glassmorphism Test Page</h1>
        
        {/* Test liquid-glass base class */}
        <div className="liquid-glass p-6 rounded-xl mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">Base Glass Morphism</h2>
          <p className="text-white/90">This should have the glass effect with blur and transparency.</p>
        </div>
        
        {/* Test tier-specific glass classes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="liquid-glass-tier-foundational p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-2">Foundational Tier</h2>
            <p className="text-white/90">This should have blue-cyan gradient glass effect.</p>
          </div>
          
          <div className="liquid-glass-tier-core p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-2">Core Tier</h2>
            <p className="text-white/90">This should have green gradient glass effect.</p>
          </div>
          
          <div className="liquid-glass-tier-specialized p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-2">Specialized Tier</h2>
            <p className="text-white/90">This should have purple gradient glass effect.</p>
          </div>
          
          <div className="liquid-glass-tier-quality p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-2">Quality Tier</h2>
            <p className="text-white/90">This should have orange-red gradient glass effect.</p>
          </div>
        </div>
        
        {/* Test interactive glass elements */}
        <div className="liquid-glass-interactive liquid-glass p-6 rounded-xl mt-6">
          <h2 className="text-xl font-semibold text-white mb-2">Interactive Glass Element</h2>
          <p className="text-white/90">This should have hover effects and be interactive.</p>
        </div>
        
        {/* Test glass module card */}
        <div className="liquid-glass-module-card mt-6">
          <h2 className="text-xl font-semibold text-white mb-2">Glass Module Card</h2>
          <p className="text-white/90">This should look like a module card with tier-specific top border.</p>
        </div>
      </div>
    </div>
  );
};

export default TestGlassmorphismPage;