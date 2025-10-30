// src/composables/useVirtualCurrency.ts
import { computed } from 'vue'
import { useBetsStore } from '../stores/bets'

export function useVirtualCurrency() {
  const betsStore = useBetsStore()
  
  // Available balance (balance - locked)
  const availableBalance = computed(() => {
    return betsStore.bankroll.balance
  })
  
  // Total balance (balance + locked)
  const totalBalance = computed(() => {
    return betsStore.bankroll.balance + betsStore.bankroll.locked
  })
  
  // Locked balance
  const lockedBalance = computed(() => {
    return betsStore.bankroll.locked
  })
  
  // Bankroll information
  const bankroll = computed(() => betsStore.bankroll)
  
  return {
    availableBalance,
    totalBalance,
    lockedBalance,
    bankroll
  }
}
