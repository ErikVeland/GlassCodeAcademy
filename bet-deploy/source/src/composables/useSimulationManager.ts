// src/composables/useSimulationManager.ts
import { ref } from 'vue'

// Global simulation counter to limit concurrent simulations
const activeSimulationCount = ref(0)
const MAX_CONCURRENT_SIMULATIONS = 5

export function useSimulationManager() {
  // Check if we can start a new simulation
  const canStartSimulation = () => {
    return activeSimulationCount.value < MAX_CONCURRENT_SIMULATIONS
  }
  
  // Increment the active simulation count
  const incrementSimulationCount = () => {
    activeSimulationCount.value++
  }
  
  // Decrement the active simulation count
  const decrementSimulationCount = () => {
    activeSimulationCount.value = Math.max(0, activeSimulationCount.value - 1)
  }
  
  // Get the current active simulation count
  const getActiveSimulationCount = () => {
    return activeSimulationCount.value
  }
  
  // Get the maximum allowed concurrent simulations
  const getMaxConcurrentSimulations = () => {
    return MAX_CONCURRENT_SIMULATIONS
  }
  
  // Calculate optimal tick interval based on active simulations
  const calculateOptimalTickInterval = () => {
    // Increase tick interval as more simulations run to prevent browser lockup
    const baseInterval = 500
    const increment = 100
    return baseInterval + (activeSimulationCount.value * increment)
  }
  
  return {
    canStartSimulation,
    incrementSimulationCount,
    decrementSimulationCount,
    getActiveSimulationCount,
    getMaxConcurrentSimulations,
    calculateOptimalTickInterval
  }
}