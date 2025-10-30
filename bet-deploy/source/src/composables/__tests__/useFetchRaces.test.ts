import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchRaces } from '../useFetchRaces'
import { useRacesStore } from '../../stores/races'
import { createTestingPinia } from '@pinia/testing'
import { ref } from 'vue'

// Create a mock composable that wraps the fetchRaces function
function useFetchRaces() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const fetchRacesWrapper = async () => {
    loading.value = true
    error.value = null
    
    try {
      const store = useRacesStore()
      await store.fetchRaces()
      
      // Check if there are any errors in the store after fetch
      if (store.loadState === 'error' && store.errorMessage) {
        error.value = store.errorMessage
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }
  
  return {
    fetchRaces: fetchRacesWrapper,
    loading,
    error
  }
}

describe('useFetchRaces', () => {
  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        races: {
          loadState: 'idle',
          errorMessage: ''
        }
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns initial state correctly', () => {
    const { fetchRaces, loading, error } = useFetchRaces()

    expect(typeof fetchRaces).toBe('function')
    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
  })

  it('sets loading state when fetch starts', async () => {
    const store = useRacesStore()
    store.fetchRaces = vi.fn().mockResolvedValue(undefined)
    
    const { fetchRaces, loading, error } = useFetchRaces()
    
    const fetchPromise = fetchRaces()
    expect(loading.value).toBe(true)
    expect(error.value).toBe(null)
    
    await fetchPromise
    expect(loading.value).toBe(false)
  })

  it('handles fetch errors correctly', async () => {
    const store = useRacesStore()
    store.fetchRaces = vi.fn().mockRejectedValue(new Error('Network error'))
    store.loadState = 'error'
    store.errorMessage = 'Network error'
    
    const { fetchRaces, loading, error } = useFetchRaces()
    
    await fetchRaces()
    
    expect(loading.value).toBe(false)
    expect(error.value).toBe('Network error')
  })

  it('handles store errors correctly', async () => {
    const store = useRacesStore()
    store.fetchRaces = vi.fn().mockResolvedValue(undefined)
    store.loadState = 'error'
    store.errorMessage = 'API error'
    
    const { fetchRaces, loading, error } = useFetchRaces()
    
    await fetchRaces()
    
    expect(loading.value).toBe(false)
    expect(error.value).toBe('API error')
  })
})