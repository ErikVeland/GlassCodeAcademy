import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAnimationEffects } from '../useAnimationEffects'
import { useBetsStore } from '../../stores/bets'
import { createPinia, setActivePinia } from 'pinia'

describe('useAnimationEffects', () => {
  beforeEach(() => {
    // Create a new pinia instance and make it active
    setActivePinia(createPinia())
  })

  it('manages celebration states correctly', () => {
    const store = useBetsStore()
    store.lastWonBetId = null
    
    const { showConfetti, showWinCelebration, winAmount, triggerWelcomeCelebration, triggerWinCelebration, lastWonBetId } = useAnimationEffects()
    
    // Initially, celebrations should be hidden
    expect(showConfetti.value).toBe(false)
    expect(showWinCelebration.value).toBe(false)
    expect(winAmount.value).toBe(0)
    
    // Trigger welcome celebration
    triggerWelcomeCelebration()
    
    // Check that confetti is shown
    expect(showConfetti.value).toBe(true)
    
    // Trigger win celebration
    triggerWinCelebration(5000) // $50.00
    
    // Check that celebrations are shown
    expect(showConfetti.value).toBe(true)
    expect(showWinCelebration.value).toBe(true)
    expect(winAmount.value).toBe(5000)
  })
})