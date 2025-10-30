import { useSimulationStore } from '../stores/simulation'
import { createRaceSimulation, type RaceInput, type SimulationController } from '../game/simulatedRace'

export function useRaceSimulation() {
  const simulationStore = useSimulationStore()
  
  const createSimulation = (
    input: RaceInput,
    seed?: number,
    tickMs: number = 200
  ): SimulationController => {
    // Create the simulation controller
    const controller = createRaceSimulation(input, seed, tickMs)
    
    // Add to store
    simulationStore.addSimulationController(input.id, controller)
    
    return controller
  }
  
  const getSimulation = (raceId: string): SimulationController | undefined => {
    return simulationStore.getSimulationController(raceId)
  }
  
  const removeSimulation = (raceId: string): void => {
    simulationStore.removeSimulationController(raceId)
  }
  
  const startSimulation = (raceId: string): void => {
    simulationStore.startSimulation(raceId)
  }
  
  const stopSimulation = (raceId: string): void => {
    simulationStore.stopSimulation(raceId)
  }
  
  const resetSimulation = (raceId: string): void => {
    simulationStore.resetSimulation(raceId)
  }
  
  return {
    createSimulation,
    getSimulation,
    removeSimulation,
    startSimulation,
    stopSimulation,
    resetSimulation
  }
}