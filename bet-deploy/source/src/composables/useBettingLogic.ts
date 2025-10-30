// src/composables/useBettingLogic.ts
import { computed, ref } from 'vue'
import { useBetsStore } from '../stores/bets'
import type { BetSelection } from '../stores/bets'

export function useBettingLogic() {
  const betsStore = useBetsStore()
  
  // Active bets
  const activeBets = computed(() => betsStore.engine.listBets())
  
  // Total stake of all active bets
  const totalStake = computed(() => {
    return betsStore.engine.listBets().reduce((sum, bet) => sum + bet.stake, 0)
  })
  
  // Bankroll information
  const bankroll = computed(() => betsStore.bankroll)
  
  // Place a bet
  const placeBet = (raceId: string, runnerId: string, amount: number, odds: number | 'SP') => {
    return betsStore.placeBet(raceId, runnerId, amount, odds)
  }
  
  // Cancel a bet
  const cancelBet = (betId: string) => {
    return betsStore.cancelBet(betId)
  }
  
  // Settle a race
  const settleRace = (raceId: string, result: { placings: string[] }) => {
    betsStore.settleRace(raceId, result)
  }
  
  // Calculate estimated return for a bet (simplified)
  const calculateEstimatedReturn = (stake: number, odds: number | 'SP', market: 'win' | 'place' | 'each-way'): number => {
    const numericOdds = odds === 'SP' ? 6.0 : (typeof odds === 'number' ? odds : parseFloat(String(odds)))
    
    // Handle invalid odds
    if (isNaN(numericOdds) || numericOdds <= 0) {
      return 0
    }
    
    switch (market) {
      case 'win':
        return stake * numericOdds
      case 'place':
        // Simplified place odds calculation
        return stake * (1 + 0.25 * (numericOdds - 1))
      case 'each-way':
        // Each-way: half stake on win, half on place
        const winPart = (stake / 2) * numericOdds
        const placePart = (stake / 2) * (1 + 0.25 * (numericOdds - 1))
        return winPart + placePart
      default:
        return 0
    }
  }
  
  // Check if we can place bets
  const canPlaceBets = computed(() => {
    // For now, always return true since we don't have selection management
    return true
  })
  
  return {
    // Bets
    activeBets,
    totalStake,
    bankroll,
    
    // Actions
    placeBet,
    cancelBet,
    settleRace,
    calculateEstimatedReturn,
    
    // Validation
    canPlaceBets
  }
}