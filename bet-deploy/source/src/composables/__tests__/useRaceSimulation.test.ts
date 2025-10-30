import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useRaceSimulation } from '../useRaceSimulation'
import { createRaceSimulation } from '../../game/simulatedRace'

// Mock the createRaceSimulation function
vi.mock('../../game/simulatedRace', () => ({
  createRaceSimulation: vi.fn().mockReturnValue({
    id: 'controller1',
    start: vi.fn(),
    stop: vi.fn(),
    onTick: vi.fn(),
    onFinish: vi.fn(),
    getSeed: vi.fn(),
    getPlannedDurationMs: vi.fn()
  })
}))

describe('useRaceSimulation', () => {
  beforeEach(() => {
    // Create a new pinia instance and make it active
    setActivePinia(createPinia())
  })

  it('creates and manages race simulations', () => {
    const { createSimulation, getSimulation, removeSimulation } = useRaceSimulation()
    
    // Create a race input
    const raceInput = {
      id: 'race1',
      meetingName: 'Test Meeting',
      raceNumber: 1,
      categoryId: '4a2788f8-e825-4d36-9894-efd4baf1cfae',
      runners: [
        { id: 'runner1', number: 1, name: 'Test Runner 1' },
        { id: 'runner2', number: 2, name: 'Test Runner 2' }
      ]
    }
    
    // Create a simulation
    const controller = createSimulation(raceInput, 12345, 200)
    
    // Check that the controller was created
    expect(controller).toEqual({
      id: 'controller1',
      start: expect.any(Function),
      stop: expect.any(Function),
      onTick: expect.any(Function),
      onFinish: expect.any(Function),
      getSeed: expect.any(Function),
      getPlannedDurationMs: expect.any(Function)
    })
    expect(createRaceSimulation).toHaveBeenCalledWith(raceInput, 12345, 200)
    
    // Get the simulation
    const retrievedController = getSimulation('race1')
    expect(retrievedController).toEqual({
      id: 'controller1',
      start: expect.any(Function),
      stop: expect.any(Function),
      onTick: expect.any(Function),
      onFinish: expect.any(Function),
      getSeed: expect.any(Function),
      getPlannedDurationMs: expect.any(Function)
    })
    
    // Remove the simulation
    removeSimulation('race1')
    
    // Check that the simulation was removed
    const removedController = getSimulation('race1')
    expect(removedController).toBeUndefined()
  })
})