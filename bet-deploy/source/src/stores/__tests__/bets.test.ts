import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useBetsStore } from '../bets'
import { createPinia, setActivePinia } from 'pinia'

describe('useBetsStore', () => {
  beforeEach(() => {
    // Create a new pinia instance and make it active
    setActivePinia(createPinia())
  })

  it('initializes with correct default state', () => {
    const store = useBetsStore()
    
    // Check default state
    expect(store.showGame).toBe(false)
    expect(store.bankroll.balance).toBe(1000) // Initial bankroll from BettingEngine
  })

  it('can place bets', () => {
    const store = useBetsStore()
    
    // Mock the engine's placeBet method
    const mockPlaceBet = vi.fn().mockReturnValue('bet1')
    store.engine.placeBet = mockPlaceBet
    
    // Place a bet
    const result = store.placeBet('race1', 'runner1', 100, 2.5, undefined, 'Test Race', 1, 'Test Runner', '4a2788f8-e825-4d36-9894-efd4baf1cfae')
    
    // Check that the bet was placed
    expect(result).toBe('bet1')
    expect(mockPlaceBet).toHaveBeenCalledWith('race1', 'runner1', 100, 2.5, undefined, 'Test Race', 1, 'Test Runner', '4a2788f8-e825-4d36-9894-efd4baf1cfae')
  })

  it('can cancel bets', () => {
    const store = useBetsStore()
    
    // Mock the engine's cancelBet method
    const mockCancelBet = vi.fn().mockReturnValue(true)
    store.engine.cancelBet = mockCancelBet
    
    // Cancel a bet
    const result = store.cancelBet('bet1')
    
    // Check that the bet was cancelled
    expect(result).toBe(true)
    expect(mockCancelBet).toHaveBeenCalledWith('bet1')
  })

  it('can settle races', () => {
    const store = useBetsStore()
    
    // Mock the engine's settleRace method
    const mockSettleRace = vi.fn().mockReturnValue([])
    store.engine.settleRace = mockSettleRace
    
    // Settle a race
    const result = store.settleRace('race1', { placings: ['runner1', 'runner2'] })
    
    // Check that the race was settled
    expect(mockSettleRace).toHaveBeenCalledWith({
      raceId: 'race1',
      placings: ['runner1', 'runner2'],
      finishTimesMs: {}
    })
  })

  it('can toggle game mode', () => {
    const store = useBetsStore()
    
    // Check initial state
    expect(store.showGame).toBe(false)
    
    // Toggle game mode on
    store.setShowGame(true)
    expect(store.showGame).toBe(true)
    
    // Toggle game mode off
    store.setShowGame(false)
    expect(store.showGame).toBe(false)
  })

  it('can reset the engine', () => {
    const store = useBetsStore()
    
    const initialEngine = store.engine
    
    // Reset the engine
    store.reset()
    
    // Check that the engine was reset (should be a new instance)
    expect(store.engine).not.toBe(initialEngine)
    expect(store.engine.getBankroll().balance).toBe(1000)
  })
})