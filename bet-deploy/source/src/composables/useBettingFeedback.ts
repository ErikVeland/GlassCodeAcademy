// src/composables/useBettingFeedback.ts
import { ref } from 'vue'

export function useBettingFeedback() {
  // Audio context for playing sounds
  let audioContext: AudioContext | null = null
  
  // Initialize audio context on first user interaction
  const initAudio = () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }
  
  // Play a success sound (pleasant chime)
  const playSuccessSound = () => {
    if (!audioContext) return
    
    try {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1) // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2) // G5
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (e) {
      console.warn('Could not play success sound:', e)
    }
  }
  
  // Play an error sound (subtle buzz)
  const playErrorSound = () => {
    if (!audioContext) return
    
    try {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.type = 'square'
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime)
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (e) {
      console.warn('Could not play error sound:', e)
    }
  }
  
  // Flash an element with a specific color
  const flashElement = (element: HTMLElement, color: 'green' | 'red' | 'blue' | 'yellow') => {
    // Add flash class
    element.classList.add('flash', `flash-${color}`)
    
    // Remove class after animation completes
    setTimeout(() => {
      element.classList.remove('flash', `flash-${color}`)
    }, 1000)
  }
  
  // Show a temporary toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Create toast element
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-text-inverse font-medium transform transition-all duration-300 ${
      type === 'success' ? 'bg-success' : 
      type === 'error' ? 'bg-danger' : 
      'bg-brand-primary'
    }`
    toast.textContent = message
    toast.style.opacity = '0'
    toast.style.transform = 'translateX(100%)'
    
    // Add to document
    document.body.appendChild(toast)
    
    // Animate in
    setTimeout(() => {
      toast.style.opacity = '1'
      toast.style.transform = 'translateX(0)'
    }, 10)
    
    // Remove after delay
    setTimeout(() => {
      toast.style.opacity = '0'
      toast.style.transform = 'translateX(100%)'
      
      // Remove element after animation
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 300)
    }, 3000)
  }
  
  return {
    initAudio,
    playSuccessSound,
    playErrorSound,
    flashElement,
    showToast
  }
}