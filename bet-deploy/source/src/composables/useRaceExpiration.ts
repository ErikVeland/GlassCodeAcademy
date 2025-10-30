import { ref, computed, watch } from 'vue'
import { type RaceSummary } from '../stores/races'

interface ExpiringRace {
  race: RaceSummary
  isExpiring: boolean
}

export function useRaceExpiration(races: RaceSummary[]) {
  const expiringRaces = ref<Set<string>>(new Set())
  
  // Watch for changes in the races array
  watch(() => races, (newRaces, oldRaces) => {
    if (oldRaces) {
      const oldRaceIds = new Set(oldRaces.map(r => r.id))
      const newRaceIds = new Set(newRaces.map(r => r.id))
      
      // Find races that were removed
      const removedRaceIds = [...oldRaceIds].filter(id => !newRaceIds.has(id))
      
      // Add removed races to expiring set
      removedRaceIds.forEach(id => expiringRaces.value.add(id))
      
      // Clear expired races after animation
      if (removedRaceIds.length > 0) {
        setTimeout(() => {
          expiringRaces.value.clear()
        }, 1000)
      }
    }
  }, { deep: true })
  
  // Return races with expiration status
  const racesWithExpiration = computed(() => {
    return races.map(race => ({
      race,
      isExpiring: expiringRaces.value.has(race.id)
    }))
  })
  
  return {
    racesWithExpiration,
    expiringRaces
  }
}