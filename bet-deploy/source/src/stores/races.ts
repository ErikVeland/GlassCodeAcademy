import { defineStore } from 'pinia'
import { useBetsStore } from './bets'
import { getSimulatedRunners } from '../composables/useOddsSimulation'

/**
 * Category IDs as specified by the task brief.
 */
export const CATEGORY_IDS = {
  HORSE: '4a2788f8-e825-4d36-9894-efd4baf1cfae',
  GREYHOUND: '9daef0d7-bf3c-4f50-921d-8e818c60fe61',
  HARNESS: '161d9be2-e909-4326-8c2c-35ed71fb460b'
} as const

export type CategoryId = typeof CATEGORY_IDS[keyof typeof CATEGORY_IDS]

/**
 * Minimal shape of a race item coming from Neds API after normalization.
 */
export interface RaceSummary {
  id: string
  meeting_name: string
  race_number: number
  advertised_start_ms: number
  category_id: CategoryId | string
}

interface NedsApiRaceRaw {
  race_id: string
  meeting_name: string
  race_number: number | string
  advertised_start: {
    seconds: number | string
  }
  category_id: string
}

interface NedsApiResponse {
  status: number
  data?: {
    next_to_go_ids: string[]
    race_summaries: Record<string, NedsApiRaceRaw>
  }
  message?: string
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

/**
 * Cache entry structure
 */
interface CacheEntry {
  data: RaceSummary[]
  timestamp: number
  ttl: number // time to live in milliseconds
}

/**
 * Utility: current epoch ms
 */
const now = () => Date.now()

/**
 * Normalize raw API race to internal model.
 */
function normalizeRace(raw: NedsApiRaceRaw): RaceSummary {
  const secs = typeof raw.advertised_start?.seconds === 'string'
    ? parseInt(raw.advertised_start.seconds, 10)
    : Number(raw.advertised_start?.seconds ?? 0)

  const result = {
    id: raw.race_id,
    meeting_name: raw.meeting_name,
    race_number: typeof raw.race_number === 'string' ? parseInt(raw.race_number, 10) : Number(raw.race_number),
    advertised_start_ms: secs * 1000,
    category_id: raw.category_id
  }
  
  return result
}

/**
 * Store configuration:
 * - Holds fetched races
 * - Maintains selected categories
 * - Exposes derived "next five" filtered and sorted
 * - Handles expiry (remove after 60s post start)
 * - Manages polling + ticking intervals with cleanup
 */
export const useRacesStore = defineStore('races', {
  state: () => ({
    races: [] as RaceSummary[],
    selectedCategories: new Set<CategoryId | string>([
      CATEGORY_IDS.HORSE,
      CATEGORY_IDS.GREYHOUND,
      CATEGORY_IDS.HARNESS
    ]),
    loadState: 'idle' as LoadState,
    errorMessage: '' as string,
    // Search and filter state
    searchQuery: '' as string,
    timeFilter: 'all' as 'all' | 'next-hour' | 'next-2-hours' | 'next-4-hours',
    sortOrder: 'time-asc' as 'time-asc' | 'time-desc' | 'name-asc' | 'name-desc',
    // Caching
    cache: new Map<string, CacheEntry>(),
    cacheTTL: 30000, // 30 seconds cache TTL
    // Internal timers
    _tickHandle: null as number | null,
    _pollHandle: null as number | null
  }),
  getters: {
    /**
     * Active races filtered by selected categories and not expired.
     * Sorted by soonest advertised_start.
     */
    activeRaces(state): RaceSummary[] {
      const cutoffNow = now()
      let filtered = state.races
        .filter(r => state.selectedCategories.has(r.category_id))
        .filter(r => !isExpired(r, cutoffNow))
      
      // Apply search filter
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase().trim()
        filtered = filtered.filter(r => 
          r.meeting_name.toLowerCase().includes(query) ||
          r.race_number.toString().includes(query) ||
          // In simulation mode, also filter by runner names
          (isInSimulationMode() && raceHasRunnerMatchingQuery(r, query))
        )
      }
      
      // Apply time filter
      const currentTime = now()
      switch (state.timeFilter) {
        case 'next-hour':
          filtered = filtered.filter(r => r.advertised_start_ms <= currentTime + 3600000)
          break
        case 'next-2-hours':
          filtered = filtered.filter(r => r.advertised_start_ms <= currentTime + 7200000)
          break
        case 'next-4-hours':
          filtered = filtered.filter(r => r.advertised_start_ms <= currentTime + 14400000)
          break
      }
      
      // Apply sorting
      switch (state.sortOrder) {
        case 'time-asc':
          filtered.sort((a, b) => a.advertised_start_ms - b.advertised_start_ms)
          break
        case 'time-desc':
          filtered.sort((a, b) => b.advertised_start_ms - a.advertised_start_ms)
          break
        case 'name-asc':
          filtered.sort((a, b) => a.meeting_name.localeCompare(b.meeting_name))
          break
        case 'name-desc':
          filtered.sort((a, b) => b.meeting_name.localeCompare(a.meeting_name))
          break
      }
      
      return filtered
    },
    /**
     * Slice of the next five races.
     */
    nextFive(state): RaceSummary[] {
      const cutoffNow = now()
      let activeRaces = state.races
        .filter(r => state.selectedCategories.has(r.category_id))
        .filter(r => !isExpired(r, cutoffNow))
      
      // Apply search filter
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase().trim()
        activeRaces = activeRaces.filter(r => 
          r.meeting_name.toLowerCase().includes(query) ||
          r.race_number.toString().includes(query) ||
          // In simulation mode, also filter by runner names
          (isInSimulationMode() && raceHasRunnerMatchingQuery(r, query))
        )
      }
      
      activeRaces = activeRaces.sort((a, b) => a.advertised_start_ms - b.advertised_start_ms)
  
      return activeRaces.slice(0, 5)
    },
    /**
     * Group active races by meeting name for the meetings view.
     */
    racesByMeeting(state): Record<string, RaceSummary[]> {
      const cutoffNow = now()
      let filtered = this.activeRaces
      
      const grouped: Record<string, RaceSummary[]> = {}
      
      for (const race of filtered) {
        if (!grouped[race.meeting_name]) {
          grouped[race.meeting_name] = []
        }
        grouped[race.meeting_name].push(race)
      }
      
      // Sort races within each meeting by race number
      for (const meeting in grouped) {
        grouped[meeting].sort((a, b) => a.race_number - b.race_number)
      }
      
      return grouped
    }
  },
  actions: {
    /**
     * Fetch races from the Neds endpoint, normalize, and merge.
     * Keeps a bounded list (e.g., last 50) to avoid unbounded growth.
     */
    async fetchRaces(retryCount = 0): Promise<void> {
      this.loadState = this.loadState === 'idle' ? 'loading' : this.loadState
      this.errorMessage = ''
      
      // Check cache first
      const cacheKey = 'races'
      const cached = this.cache.get(cacheKey)
      const currentTime = now()
      
      if (cached && (currentTime - cached.timestamp) < cached.ttl) {
        // Use cached data
        this.races = cached.data
        this.loadState = 'ready'
        return
      }
      
      try {
        const isDemo = typeof window !== 'undefined' &&
          new URLSearchParams(window.location.search).get('demo') === '1'

        const proxyBase = (import.meta as any)?.env?.VITE_NEDS_PROXY_BASE || '/api/rest/v1/racing/'
        const url = isDemo
          ? '/sample/nextraces.5.json'
          : `${proxyBase}${proxyBase.endsWith('/') ? '' : '/'}?method=nextraces&count=5`

        let res = await fetch(url, {
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        })

        if (!res.ok) {
          // Gracefully handle known upstream responses
          if (res.status === 400 || res.status === 404) {
            // Fallback to demo sample for these responses, even if not in demo mode
            const demoRes = await fetch('/sample/nextraces.5.json', {
              headers: { 'Content-Type': 'application/json' },
              cache: 'no-store'
            })
            if (demoRes.ok) {
              res = demoRes
            } else {
              this.races = []
              this.loadState = 'ready'
              return
            }
          } else {
            let errorMsg = `Failed to fetch races: HTTP ${res.status}`
            switch (res.status) {
              case 500:
                errorMsg = 'Server error occurred while fetching races (500)'
                break
              case 503:
                errorMsg = 'Races service temporarily unavailable (503)'
                break
              case 429:
                errorMsg = 'Too many requests. Please try again later (429)'
                break
              default:
                if (res.status >= 500) {
                  errorMsg = `Server error occurred while fetching races (${res.status})`
                } else if (res.status >= 400) {
                  errorMsg = `Client error occurred while fetching races (${res.status})`
                }
            }
            throw new Error(errorMsg)
          }
        }

        const json = (await res.json()) as NedsApiResponse

        if (!json || json.status !== 200 || !json.data) {
          throw new Error(json?.message || 'Unexpected API response format')
        }

        const items: RaceSummary[] = json.data.next_to_go_ids
          .map((id) => json.data!.race_summaries[id])
          .filter(Boolean)
          .map(normalizeRace)

        // Merge unique by id (prefer newest attributes)
        const map = new Map<string, RaceSummary>()
        for (const existing of this.races) {
          map.set(existing.id, existing)
        }
        for (const item of items) {
          map.set(item.id, item)
        }

        // Replace state with deduped, then drop expired
        const merged = Array.from(map.values())
        const t = now()
        this.races = merged
          .filter(r => !isExpired(r, t))
          .sort((a, b) => a.advertised_start_ms - b.advertised_start_ms)
          .slice(0, 50) // bound
          
        // Cache the results
        this.cache.set(cacheKey, {
          data: this.races,
          timestamp: currentTime,
          ttl: this.cacheTTL
        })
        
        this.loadState = 'ready'
        
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        
        // Implement retry mechanism for transient errors
        if (retryCount < 3 && (msg.includes('500') || msg.includes('503') || msg.includes('network') || msg.includes('fetch'))) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, retryCount) * 1000
          setTimeout(() => {
            // Use the action directly
            this.fetchRaces(retryCount + 1)
          }, delay)
          return
        }
        
        this.errorMessage = msg
        this.loadState = 'error'
      }
    },

    /**
     * Toggle a category filter on/off.
     */
    toggleCategory(categoryId: CategoryId | string): void {
      if (this.selectedCategories.has(categoryId)) {
        this.selectedCategories.delete(categoryId)
      } else {
        this.selectedCategories.add(categoryId)
      }
    },

    /**
     * Set search query for filtering races.
     */
    setSearchQuery(query: string): void {
      this.searchQuery = query
    },

    /**
     * Set time filter for races.
     */
    setTimeFilter(filter: 'all' | 'next-hour' | 'next-2-hours' | 'next-4-hours'): void {
      this.timeFilter = filter
    },

    /**
     * Set sort order for races.
     */
    setSortOrder(order: 'time-asc' | 'time-desc' | 'name-asc' | 'name-desc'): void {
      this.sortOrder = order
    },

    /**
     * Clear the cache.
     */
    clearCache(): void {
      this.cache.clear()
    },

    /**
     * Set cache TTL (in milliseconds).
     */
    setCacheTTL(ttl: number): void {
      this.cacheTTL = ttl
    },

    /**
     * Ensure no expired races remain in state.
     */
    pruneExpired(): void {
      const t = now()
      if (this.races.length === 0) return
      const before = this.races.length
      this.races = this.races.filter(r => !isExpired(r, t))
      const after = this.races.length
      
      // If we removed races and now have fewer than 5, fetch more
      if (before > after && after < 5) {
        // Trigger a fetch in the background
        setTimeout(() => {
          // Get the store instance and call the action
          const store = useRacesStore()
          store.fetchRaces()
        }, 100)
      }
      
      if (after !== before) {
        // Keep sorted when pruning affects order
        this.races.sort((a, b) => a.advertised_start_ms - b.advertised_start_ms)
      }
      
      // Clear cache when pruning
      this.clearCache()
    },

    /**
     * Begin ticking (once per second) to:
     *  - trigger reactive countdown updates in UI
     *  - prune expired entries
     * Also starts a light polling loop to refresh races every 15s.
     */
    startLoops(): void {
      if (this._tickHandle == null) {
        this._tickHandle = window.setInterval(() => {
          // Trigger reactivity by touching a derived piece of state:
          // we don't store "now" in state to avoid re-renders everywhere.
          // Instead, we prune expired and any countdown component can
          // observe Date.now() or computed props.
          this.pruneExpired()
        }, 1000)
      }

      if (this._pollHandle == null) {
        // Stagger initial fetch to avoid immediate double-hit when startLoops is called
        // by mounting + manual fetch in setup.
        this._pollHandle = window.setInterval(() => {
          // Fire and forget; errors are reflected in state
          void this.fetchRaces()
        }, 15000)
      }
    },

    /**
     * Stop all timers — call this in onUnmounted of root or when
     * navigating away to avoid leaks.
     */
    stopLoops(): void {
      if (this._tickHandle != null) {
        clearInterval(this._tickHandle)
        this._tickHandle = null
      }
      if (this._pollHandle != null) {
        clearInterval(this._pollHandle)
        this._pollHandle = null
      }
    },

    /**
     * Hard reset state (useful for e2e tests or error recoveries).
     */
    reset(): void {
      this.stopLoops()
      this.races = []
      this.selectedCategories = new Set<CategoryId | string>([
        CATEGORY_IDS.HORSE,
        CATEGORY_IDS.GREYHOUND,
        CATEGORY_IDS.HARNESS
      ])
      this.searchQuery = ''
      this.timeFilter = 'all'
      this.sortOrder = 'time-asc'
      this.cache.clear()
      this.loadState = 'idle'
      this.errorMessage = ''
    }
  }
})

/**
 * A race is considered expired 60,000ms after its advertised start time.
 */
function isExpired(r: RaceSummary, t: number): boolean {
  const result = t >= (r.advertised_start_ms + 60000);
  return result;
}

// Helper function to check if we're in simulation mode
function isInSimulationMode(): boolean {
  const betsStore = useBetsStore()
  return betsStore.showGame && betsStore.useSimulatedData
}

// Helper function to check if a race has runners matching the search query
function raceHasRunnerMatchingQuery(race: RaceSummary, query: string): boolean {
  // Only check runner names in simulation mode
  if (!isInSimulationMode()) {
    return false
  }
  
  const runners = getSimulatedRunners(race.id)
  
  return runners.some((runner: any) => 
    runner.name.toLowerCase().includes(query)
  )
}