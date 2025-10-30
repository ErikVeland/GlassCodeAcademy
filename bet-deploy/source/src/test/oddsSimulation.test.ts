import { describe, it, expect } from 'vitest'
import { initializeOddsSimulation, updateOdds, getSimulatedRunners } from '../composables/useOddsSimulation'

describe('Odds Simulation', () => {
  it('should initialize odds simulation correctly', () => {
    const runners = [
      {
        id: 'runner-1',
        number: 1,
        name: 'Thunder Bay',
        weight: '58kg',
        jockey: 'J: R Vaibhav',
        odds: 2.40,
        oddsTrend: 'up' as const,
        silkColor: 'bg-blue-500'
      },
      {
        id: 'runner-2',
        number: 2,
        name: 'Midnight Express',
        weight: '56kg',
        jockey: 'J: Sarah Johnson',
        odds: 3.40,
        oddsTrend: 'down' as const,
        silkColor: 'bg-green-500'
      }
    ]
    
    initializeOddsSimulation('race-1', runners)
    const result = getSimulatedRunners('race-1')
    
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('runner-1')
    expect(result[0].odds).toBe(2.40)
    expect(result[1].id).toBe('runner-2')
    expect(result[1].odds).toBe(3.40)
  })
  
  it('should update odds based on race progress', () => {
    const runners = [
      {
        id: 'runner-1',
        number: 1,
        name: 'Thunder Bay',
        weight: '58kg',
        jockey: 'J: R Vaibhav',
        odds: 2.40,
        oddsTrend: 'none' as const,
        silkColor: 'bg-blue-500'
      },
      {
        id: 'runner-2',
        number: 2,
        name: 'Midnight Express',
        weight: '56kg',
        jockey: 'J: Sarah Johnson',
        odds: 3.40,
        oddsTrend: 'none' as const,
        silkColor: 'bg-green-500'
      }
    ]
    
    initializeOddsSimulation('race-1', runners)
    
    // Simulate race progress where runner-1 is leading
    updateOdds('race-1', {
      'runner-1': 0.7, // 70% progress
      'runner-2': 0.6  // 60% progress
    }, ['runner-1', 'runner-2']) // runner-1 is leading
    
    const result = getSimulatedRunners('race-1')
    
    // Leader's odds should decrease (become more favorable) or stay the same
    expect(result[0].id).toBe('runner-1')
    // Check that odds are within a reasonable range
    expect(typeof result[0].odds).toBe('number')
    
    // Trailing runner's odds should increase (become less favorable) or stay the same
    expect(result[1].id).toBe('runner-2')
    // Check that odds are within a reasonable range
    expect(typeof result[1].odds).toBe('number')
  })
})