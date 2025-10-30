import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useBettingLogic } from '../useBettingLogic'
import { useBetsStore } from '../../stores/bets'
import { createPinia, setActivePinia } from 'pinia'

describe('useBettingLogic', () => {
  beforeEach(() => {
    // Create a new pinia instance and make it active
    setActivePinia(createPinia())
  })

  it('returns correct bet information', () => {
    const store = useBetsStore()
    const { activeBets, totalStake, bankroll } = useBettingLogic()
    
    // Check that the bet information is correct
    expect(Array.isArray(activeBets.value)).toBe(true)
    expect(totalStake.value).toBe(0)
    expect(bankroll.value).toEqual(store.bankroll)
  })

  it('places and cancels bets correctly', () => {
    const betsStore = useBetsStore()
    const { placeBet, cancelBet } = useBettingLogic()
    
    // Mock the store methods
    const mockPlaceBet = vi.fn().mockReturnValue('bet1')
    const mockCancelBet = vi.fn().mockReturnValue(true)
    
    betsStore.placeBet = mockPlaceBet
    betsStore.cancelBet = mockCancelBet
    
    // Place a bet
    const result = placeBet('race1', 'runner1', 100, 2.5)
    
    // Check that the bet was placed
    expect(result).toBe('bet1')
    expect(mockPlaceBet).toHaveBeenCalledWith('race1', 'runner1', 100, 2.5)
    
    // Cancel a bet
    const cancelResult = cancelBet('bet1')
    
    // Check that the bet was cancelled
    expect(cancelResult).toBe(true)
    expect(mockCancelBet).toHaveBeenCalledWith('bet1')
  })

  it('calculates estimated return correctly', () => {
    const { calculateEstimatedReturn } = useBettingLogic()
    
    // Test win market
    let result = calculateEstimatedReturn(1000, 2.5, 'win')
    expect(result).toBe(2500)
    
    // Test place market
    result = calculateEstimatedReturn(1000, 2.5, 'place')
    expect(result).toBe(1375) // 1000 * (1 + 0.25 * (2.5 - 1)) = 1000 * 1.375 = 1375
    
    // Test each-way market
    result = calculateEstimatedReturn(1000, 2.5, 'each-way')
    // Win part: 500 * 2.5 = 1250
    // Place part: 500 * (1 + 0.25 * (2.5 - 1)) = 500 * 1.375 = 687.5
    // Total: 1250 + 687.5 = 1937.5
    expect(result).toBe(1937.5)
    
    // Test SP odds
    result = calculateEstimatedReturn(1000, 'SP', 'win')
    expect(result).toBe(6000) // 1000 * 6.0
  })

  it('validates bet placement correctly', () => {
    const { canPlaceBets } = useBettingLogic()
    
    // Should always be able to place bets in current implementation
    expect(canPlaceBets.value).toBe(true)
  })
})