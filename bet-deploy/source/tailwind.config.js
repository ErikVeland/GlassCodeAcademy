// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class', '[data-theme="dark"]'],
	content: [
		'./index.html',
		'./src/**/*.{vue,js,ts,jsx,tsx}'
	],
	theme: {
		extend: {
			colors: {
				brand: {
					primary: '#F97316',   // orange-500
					secondary: '#0F172A', // slate-900
					accent: '#FACC15'     // yellow-400
				},
				surface: {
					DEFAULT: '#0B1220',   // deep background
					raised: '#111827',    // gray-900
					sunken: '#0A0F1C'
				},
				text: {
					base: '#F8FAFC',      // slate-50
					muted: '#94A3B8',     // slate-404
					inverse: '#111827'
				},
				success: '#16A34A',
				warning: '#F59E0B',
				danger: '#DC2626',
				info: '#2563EB',
				// Race type colors
				horse: '#F97316',     // Orange (same as brand-primary)
				greyhound: '#C0C0C0', // Coppery silver
				harness: '#DC2626'    // Red (more red than orangey red)
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'Apple Color Emoji', 'Segoe UI Emoji', 'sans-serif'],
				mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace']
			},
			borderRadius: {
				'xl2': '1.25rem'
			},
			boxShadow: {
				card: '0 6px 24px rgba(0,0,0,0.18)'
			},
			keyframes: {
				shimmer: {
					'0%': { backgroundPosition: '-468px 0' },
					'100%': { backgroundPosition: '468px 0' }
				},
				tick: {
					'0%': { transform: 'scale(1)' },
					'100%': { transform: 'scale(1)' }
				},
				// Enhanced animations
				'fade-in-up': {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'fade-in-down': {
					'0%': {
						opacity: '0',
						transform: 'translateY(-20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'fade-in-left': {
					'0%': {
						opacity: '0',
						transform: 'translateX(20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(0)'
					}
				},
				'fade-in-right': {
					'0%': {
						opacity: '0',
						transform: 'translateX(-20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(0)'
					}
				},
				'slide-in-left': {
					'0%': {
						transform: 'translateX(-100%)'
					},
					'100%': {
						transform: 'translateX(0)'
					}
				},
				'slide-in-right': {
					'0%': {
						transform: 'translateX(100%)'
					},
					'100%': {
						transform: 'translateX(0)'
					}
				},
				'slide-out-left': {
					'0%': {
						transform: 'translateX(0)'
					},
					'100%': {
						transform: 'translateX(-100%)'
					}
				},
				'slide-out-right': {
					'0%': {
						transform: 'translateX(0)'
					},
					'100%': {
						transform: 'translateX(100%)'
					}
				},
				'bounce-in': {
					'0%': {
						opacity: '0',
						transform: 'scale(0.3)'
					},
					'50%': {
						opacity: '1',
						transform: 'scale(1.05)'
					},
					'70%': {
						transform: 'scale(0.9)'
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1)'
					}
				},
				'pulse-slow': {
					'0%, 100%': {
						opacity: '1'
					},
					'50%': {
						opacity: '0.5'
					}
				},
				'spin-slow': {
					'0%': {
						transform: 'rotate(0deg)'
					},
					'100%': {
						transform: 'rotate(360deg)'
					}
				},
				// Enhanced race animations
				'odds-change-up': {
					'0%': {
						transform: 'scale(1)',
						backgroundColor: 'rgba(22, 163, 74, 0.2)'
					},
					'50%': {
						transform: 'scale(1.1)',
						backgroundColor: 'rgba(22, 163, 74, 0.4)'
					},
					'100%': {
						transform: 'scale(1)',
						backgroundColor: 'transparent'
					}
				},
				'odds-change-down': {
					'0%': {
						transform: 'scale(1)',
						backgroundColor: 'rgba(220, 38, 38, 0.2)'
					},
					'50%': {
						transform: 'scale(1.1)',
						backgroundColor: 'rgba(220, 38, 38, 0.4)'
					},
					'100%': {
						transform: 'scale(1)',
						backgroundColor: 'transparent'
					}
				},
				'race-finish': {
					'0%': {
						transform: 'scale(1)',
						boxShadow: '0 0 0 0 rgba(249, 115, 22, 0.4)'
					},
					'70%': {
						transform: 'scale(1.02)',
						boxShadow: '0 0 0 10px rgba(249, 115, 22, 0)'
					},
					'100%': {
						transform: 'scale(1)',
						boxShadow: '0 0 0 0 rgba(249, 115, 22, 0)'
					}
				}
			},
			animation: {
				shimmer: 'shimmer 1.2s linear infinite',
				tick: 'tick 1s steps(1,end) infinite',
				// Enhanced animations
				'fade-in-up': 'fade-in-up 0.3s ease-out',
				'fade-in-down': 'fade-in-down 0.3s ease-out',
				'fade-in-left': 'fade-in-left 0.3s ease-out',
				'fade-in-right': 'fade-in-right 0.3s ease-out',
				'slide-in-left': 'slide-in-left 0.3s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'slide-out-left': 'slide-out-left 0.3s ease-in',
				'slide-out-right': 'slide-out-right 0.3s ease-in',
				'bounce-in': 'bounce-in 0.6s ease-out',
				'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'spin-slow': 'spin-slow 3s linear infinite',
				'odds-change-up': 'odds-change-up 0.5s ease-out',
				'odds-change-down': 'odds-change-down 0.5s ease-out',
				'race-finish': 'race-finish 1s ease-out'
			}
		}
	},
	plugins: [
		require('@tailwindcss/forms'),
		require('@tailwindcss/typography')
	],
	safelist: [
		// Allow semantic helpers that might be toggled at runtime
		'bg-surface',
		'bg-surface-raised',
		'text-text-base',
		'text-text-muted',
		'text-brand-primary',
		'border-brand-primary',
		'ring-brand-primary',
		'border-surface',
		'border-surface-raised',
		'border-surface-sunken',
		// Race type colors
		'bg-horse',
		'bg-greyhound',
		'bg-harness',
		'text-horse',
		'text-greyhound',
		'text-harness'
	]
}