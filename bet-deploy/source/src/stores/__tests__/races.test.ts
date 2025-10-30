import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useRacesStore, CATEGORY_IDS } from '../races'
import { createPinia, setActivePinia } from 'pinia'

describe('racesStore', () => {
  beforeEach(() => {
    // Create a new pinia instance and make it active
    setActivePinia(createPinia())
  })

  it('initializes with correct default state', () => {
    const store = useRacesStore()

    expect(store.races).toEqual([])
    expect(store.selectedCategories).toEqual(new Set([
      CATEGORY_IDS.HORSE,
      CATEGORY_IDS.GREYHOUND,
      CATEGORY_IDS.HARNESS
    ]))
    expect(store.loadState).toBe('idle')
    expect(store.errorMessage).toBe('')
    expect(store._tickHandle).toBeNull()
    expect(store._pollHandle).toBeNull()
  })

  it('toggles category correctly', () => {
    const store = useRacesStore()

    // Initially all categories should be selected
    expect(store.selectedCategories.has(CATEGORY_IDS.HORSE)).toBe(true)
    
    // Toggle off horse category
    store.toggleCategory(CATEGORY_IDS.HORSE)
    expect(store.selectedCategories.has(CATEGORY_IDS.HORSE)).toBe(false)
    
    // Toggle back on
    store.toggleCategory(CATEGORY_IDS.HORSE)
    expect(store.selectedCategories.has(CATEGORY_IDS.HORSE)).toBe(true)
  })

  it('adds race correctly', () => {
    const store = useRacesStore()
    
    const mockRace = {
      id: '1',
      meeting_name: 'WARRAGUL',
      race_number: 12,
      advertised_start_ms: Date.now() + 120000,
      category_id: CATEGORY_IDS.HORSE
    }
    
    // @ts-ignore - we're directly manipulating state for testing
    store.races = [mockRace]
    
    expect(store.races.length).toBe(1)
    expect(store.races[0]).toEqual(mockRace)
  })

  it('computes activeRaces correctly', () => {
    const store = useRacesStore()
    
    const futureTime = Date.now() + 120000
    const pastTime = Date.now() - 120000
    
    const mockRaces = [
      {
        id: '1',
        meeting_name: 'WARRAGUL',
        race_number: 12,
        advertised_start_ms: futureTime,
        category_id: CATEGORY_IDS.HORSE
      },
      {
        id: '2',
        meeting_name: 'KOLKATA',
        race_number: 1,
        advertised_start_ms: pastTime, // This should be filtered out (expired)
        category_id: CATEGORY_IDS.GREYHOUND
      }
    ]
    
    // @ts-ignore - we're directly manipulating state for testing
    store.races = mockRaces
    
    const activeRaces = store.activeRaces
    expect(activeRaces.length).toBe(1)
    expect(activeRaces[0].id).toBe('1')
  })

  it('computes nextFive correctly', () => {
    const store = useRacesStore()
    
    const futureTime = Date.now() + 120000
    
    const mockRaces = []
    for (let i = 1; i <= 10; i++) {
      mockRaces.push({
        id: `${i}`,
        meeting_name: `MEETING_${i}`,
        race_number: i,
        advertised_start_ms: futureTime + i * 10000, // Stagger start times
        category_id: CATEGORY_IDS.HORSE
      })
    }
    
    // @ts-ignore - we're directly manipulating state for testing
    store.races = mockRaces
    
    const nextFive = store.nextFive
    expect(nextFive.length).toBe(5)
    // Should be the first 5 races (sorted by start time)
    for (let i = 0; i < 5; i++) {
      expect(nextFive[i].id).toBe(`${i + 1}`)
    }
  })

  it('computes racesByMeeting correctly', () => {
    const store = useRacesStore()
    
    const futureTime = Date.now() + 120000
    
    const mockRaces = [
      {
        id: '1',
        meeting_name: 'WARRAGUL',
        race_number: 12,
        advertised_start_ms: futureTime,
        category_id: CATEGORY_IDS.HORSE
      },
      {
        id: '2',
        meeting_name: 'WARRAGUL',
        race_number: 11,
        advertised_start_ms: futureTime,
        category_id: CATEGORY_IDS.HORSE
      },
      {
        id: '3',
        meeting_name: 'KOLKATA',
        race_number: 1,
        advertised_start_ms: futureTime,
        category_id: CATEGORY_IDS.GREYHOUND
      }
    ]
    
    // @ts-ignore - we're directly manipulating state for testing
    store.races = mockRaces
    
    const racesByMeeting = store.racesByMeeting
    expect(Object.keys(racesByMeeting).length).toBe(2)
    expect(racesByMeeting['WARRAGUL'].length).toBe(2)
    expect(racesByMeeting['KOLKATA'].length).toBe(1)
    
    // Check that races are sorted by race number within each meeting
    expect(racesByMeeting['WARRAGUL'][0].race_number).toBe(11)
    expect(racesByMeeting['WARRAGUL'][1].race_number).toBe(12)
  })

  it('starts and stops loops correctly', () => {
    const store = useRacesStore()
    
    // Start loops
    store.startLoops()
    expect(store._tickHandle).not.toBeNull()
    expect(store._pollHandle).not.toBeNull()
    
    // Stop loops
    store.stopLoops()
    expect(store._tickHandle).toBeNull()
    expect(store._pollHandle).toBeNull()
  })

  it('resets state correctly', () => {
    const store = useRacesStore()
    
    // Modify state
    // @ts-ignore - we're directly manipulating state for testing
    store.races = [{ id: '1' }]
    store.selectedCategories.clear()
    store.loadState = 'error'
    store.errorMessage = 'Test error'
    // @ts-ignore - we're directly manipulating state for testing
    store._tickHandle = 123
    // @ts-ignore - we're directly manipulating state for testing
    store._pollHandle = 456
    
    // Reset
    store.reset()
    
    // Check that state is reset to defaults
    expect(store.races).toEqual([])
    expect(store.selectedCategories).toEqual(new Set([
      CATEGORY_IDS.HORSE,
      CATEGORY_IDS.GREYHOUND,
      CATEGORY_IDS.HARNESS
    ]))
    expect(store.loadState).toBe('idle')
    expect(store.errorMessage).toBe('')
    expect(store._tickHandle).toBeNull()
    expect(store._pollHandle).toBeNull()
  })
})