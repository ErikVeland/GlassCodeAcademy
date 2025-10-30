// src/composables/useAnimationEffects.ts
import { ref, computed } from 'vue'
import { useBetsStore } from '../stores/bets'

export function useAnimationEffects() {
  const betsStore = useBetsStore()
  
  // Celebration states
  const showConfetti = ref(false)
  const showWinCelebration = ref(false)
  const winAmount = ref(0)
  
  // Trigger welcome celebration
  const triggerWelcomeCelebration = () => {
    showConfetti.value = true
    
    // Hide confetti after 3 seconds
    setTimeout(() => {
      showConfetti.value = false
    }, 3000)
  }
  
  // Trigger win celebration
  const triggerWinCelebration = (amount: number) => {
    winAmount.value = amount
    showWinCelebration.value = true
    showConfetti.value = true
    
    // Hide celebrations after 3 seconds
    setTimeout(() => {
      showWinCelebration.value = false
      showConfetti.value = false
    }, 3000)
  }
  
  // Flash element for odds changes
  const flashElement = (element: HTMLElement, color: 'green' | 'red') => {
    // Add flash class
    element.classList.add('flash', `flash-${color}`)
    
    // Remove class after animation completes
    setTimeout(() => {
      element.classList.remove('flash', `flash-${color}`)
    }, 1000)
  }
  
  // Check if a bet was recently won
  const lastWonBetId = computed(() => betsStore.lastWonBetId)
  
  return {
    // Celebration states
    showConfetti,
    showWinCelebration,
    winAmount,
    
    // Actions
    triggerWelcomeCelebration,
    triggerWinCelebration,
    flashElement,
    
    // Computed
    lastWonBetId
  }
}