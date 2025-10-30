import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useVirtualCurrency } from '../useVirtualCurrency'
import { useBetsStore } from '../../stores/bets'
import { createPinia, setActivePinia } from 'pinia'

describe('useVirtualCurrency', () => {
  beforeEach(() => {
    // Create a new pinia instance and make it active
    setActivePinia(createPinia())
  })

  it('returns correct balance information', () => {
    const store = useBetsStore()
    const { availableBalance, totalBalance, lockedBalance, bankroll } = useVirtualCurrency()
    
    // Check that the balance information is correct
    expect(availableBalance.value).toBe(store.bankroll.balance)
    expect(totalBalance.value).toBe(store.bankroll.balance + store.bankroll.locked)
    expect(lockedBalance.value).toBe(store.bankroll.locked)
    expect(bankroll.value).toEqual(store.bankroll)
  })
})