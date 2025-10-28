/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'gradient-flow': 'gradientFlow 45s ease infinite',
      },
      keyframes: {
        gradientFlow: {
          '0%, 100%': {
            background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
            'background-size': '400% 400%',
            'background-position': '0% 50%'
          },
          '50%': {
            'background-position': '100% 50%'
          }
        }
      }
    },
  },
  plugins: [
    // Removed glass-morphism plugin to avoid conflict with SCSS implementation
  ],
}