import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import PendingBetsList from '../PendingBetsList.vue'
import { useBetsStore } from '../../stores/bets'

describe('PendingBetsList', () => {
  const mockBets = [
    {
      betId: 'bet1',
      placedAtMs: Date.now(),
      stake: 1000, // $10.00
      type: 'WIN' as const,
      status: 'PENDING' as const,
      leg: {
        raceId: 'race1',
        selectionRunnerId: 'runner1',
        selectionName: 'Thunder Bay',
        oddsDecimalAtPlacement: 2.5,
        placeOddsDecimal: 1.2,
        categoryId: '4a2788f8-e825-4d36-9894-efd4baf1cfae',
        fieldSize: 8
      },
      potentialReturn: 2500
    },
    {
      betId: 'bet2',
      placedAtMs: Date.now(),
      stake: 2000, // $20.00
      type: 'PLACE' as const,
      status: 'PENDING' as const,
      leg: {
        raceId: 'race2',
        selectionRunnerId: 'runner2',
        selectionName: 'Lightning Strike',
        oddsDecimalAtPlacement: 6.0,
        placeOddsDecimal: 1.5,
        categoryId: '4a2788f8-e825-4d36-9894-efd4baf1cfae',
        fieldSize: 8
      },
      potentialReturn: 3000
    }
  ]

  beforeEach(() => {
    // Create a new pinia instance and make it active
    setActivePinia(createPinia())
  })

  it('renders correctly with bets data', () => {
    const wrapper = mount(PendingBetsList, {
      props: {
        bets: mockBets
      }
    })
    
    // Check that the component renders
    expect(wrapper.exists()).toBe(true)
    
    // Check that the bets are displayed
    expect(wrapper.findAll('[role="region"]')).toHaveLength(2)
    
    // Check that the first bet details are displayed
    expect(wrapper.text()).toContain('$10.00')
    expect(wrapper.text()).toContain('2.50')
    expect(wrapper.text()).toContain('Pending')
    expect(wrapper.text()).toContain('Thunder Bay')
    
    // Check that the second bet details are displayed
    expect(wrapper.text()).toContain('$20.00')
    expect(wrapper.text()).toContain('6.00')
    expect(wrapper.text()).toContain('Lightning Strike')
  })

  it('calls cancelBet when cancel button is clicked', async () => {
    const store = useBetsStore()
    store.cancelBet = vi.fn()
    
    const wrapper = mount(PendingBetsList, {
      props: {
        bets: [mockBets[0]]
      }
    })
    
    // Click the cancel button for the first bet
    const cancelButton = wrapper.findAll('button').find(btn => btn.text() === 'Cancel')
    expect(cancelButton).toBeTruthy()
    await cancelButton!.trigger('click')
    
    // Check that cancelBet was called with the correct bet ID
    expect(store.cancelBet).toHaveBeenCalledWith('bet1')
  })
})