import { ref, Ref, onUnmounted } from 'vue'
import { updateOdds, getSimulatedRunners } from './useOddsSimulation'

// Global store for tracking which races are in countdown status
const countdownRaces = ref<Set<string>>(new Set())
const updateIntervals = new Map<string, number>()

// Composable for managing global odds updates
export function useOddsUpdater() {

  
  // Register a race as being in countdown status
  const registerCountdownRace = (raceId: string) => {
    // REGISTER COUNTDOWN RACE
    // Registering race for odds updates: raceId
    // Current countdown races before: Array.from(countdownRaces.value)
    countdownRaces.value.add(raceId);
    // Current countdown races after: Array.from(countdownRaces.value)
    startOddsUpdates(raceId);
    // END REGISTER COUNTDOWN RACE
  }

  // Unregister a race from countdown status
  const unregisterCountdownRace = (raceId: string) => {
    // UNREGISTER COUNTDOWN RACE
    // Unregistering race from odds updates: raceId
    // Current countdown races before: Array.from(countdownRaces.value)
    countdownRaces.value.delete(raceId);
    // Current countdown races after: Array.from(countdownRaces.value)
    stopOddsUpdates(raceId);
    // END UNREGISTER COUNTDOWN RACE
  }
  
  // Start updating odds for a specific race
  const startOddsUpdates = (raceId: string) => {
    // START ODDS UPDATES
    // Starting odds updates for race: raceId
    
    // Stop any existing interval for this race
    stopOddsUpdates(raceId)
    
    // Start new interval for odds updates
    const intervalId = window.setInterval(() => {
      // Odds update interval triggered for race: raceId
      // Only update if race is still in countdown status
      if (countdownRaces.value.has(raceId)) {
        // Race is in countdown status, updating odds for: raceId
        updateRaceOdds(raceId)
      } else {
        // Race is not in countdown status, stopping updates for: raceId
        // Clean up if race is no longer in countdown status
        stopOddsUpdates(raceId)
      }
    }, 1500) // Update every 1.5 seconds for more realistic market movements
    
    updateIntervals.set(raceId, intervalId)
    // Started odds updates for race: raceId with interval ID: intervalId
    // END START ODDS UPDATES
  }
  
  // Stop updating odds for a specific race
  const stopOddsUpdates = (raceId: string) => {
    // STOP ODDS UPDATES
    // Stopping odds updates for race: raceId
    const intervalId = updateIntervals.get(raceId)
    if (intervalId) {
      // Clearing interval for race: raceId with interval ID: intervalId
      clearInterval(intervalId)
      updateIntervals.delete(raceId)
      // Stopped odds updates for race: raceId
    } else {
      // No interval found for race: raceId
    }
    // END STOP ODDS UPDATES
  }
  
  // Update odds for a specific race during countdown
  const updateRaceOdds = (raceId: string) => {
    try {
      // Attempting to update odds for race: raceId
      const runners = getSimulatedRunners(raceId)
      // Retrieved runners for race raceId
      if (runners.length > 0) {
        // For countdown races, we simulate realistic market movements
        const progressByRunner: Record<string, number> = {}
        const order: string[] = []
        
        // Create realistic progress simulation based on runner numbers and random market factors
        runners.forEach((runner: any, index: number) => {
          // Favorites (lower numbers) start with higher progress
          // But add random market fluctuations to simulate real betting activity
          const baseProgress = 1 - (runner.number / (runners.length + 2))
          // Add market volatility (±10% random movement) for more realistic fluctuations
          const marketFluctuation = (Math.random() - 0.5) * 0.2
          progressByRunner[runner.id] = Math.max(0, Math.min(1, baseProgress + marketFluctuation))
          order.push(runner.id)
        })
        
        // Sort order by progress (highest first) to determine market positions
        order.sort((a, b) => {
          return (progressByRunner[b] || 0) - (progressByRunner[a] || 0)
        })
        
        // Updating odds for countdown race raceId progress: progressByRunner order: order
        // Update odds based on the simulated market movements
        updateOdds(raceId, progressByRunner, order)
      } else {
        // No runners found for race raceId
      }
    } catch (error) {
      // Error updating odds for race raceId error
    }
  }
  
  // Clean up all intervals
  const cleanup = () => {
    updateIntervals.forEach((intervalId, raceId) => {
      clearInterval(intervalId)
      // Cleaned up odds updates for race: raceId
    })
    updateIntervals.clear()
    countdownRaces.value.clear()
  }
  
  // Return cleanup function for unmounting
  onUnmounted(() => {
    cleanup()
  })
  
  return {
    registerCountdownRace,
    unregisterCountdownRace,
    cleanup
  }
}