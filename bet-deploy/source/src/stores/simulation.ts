import { defineStore } from 'pinia'
import { type SimulationController } from '../game/simulatedRace'

// Define the simulation state structure
interface SimulationState {
  controllers: Map<string, SimulationController>
  activeRaces: Set<string>
  raceStatus: Map<string, 'pending' | 'running' | 'finished' | 'aborted'>
  speedMultipliers: Map<string, number>
  raceProgress: Map<string, {
    progressByRunner: Record<string, number>
    order: string[]
    gaps: Record<string, number>
    etaMs: number
  }>
}

export const useSimulationStore = defineStore('simulation', {
  state: (): SimulationState => ({
    controllers: new Map(),
    activeRaces: new Set(),
    raceStatus: new Map(),
    speedMultipliers: new Map(),
    raceProgress: new Map()
  }),
  
  getters: {
    getSimulationController: (state) => (raceId: string) => {
      return state.controllers.get(raceId)
    },
    
    isRaceActive: (state) => (raceId: string) => {
      return state.activeRaces.has(raceId)
    },
    
    getRaceStatus: (state) => (raceId: string) => {
      return state.raceStatus.get(raceId) || 'pending'
    },
    
    getSpeedMultiplier: (state) => (raceId: string) => {
      return state.speedMultipliers.get(raceId) || 1
    },
    
    getRaceLeader: (state) => (raceId: string) => {
      const progress = state.raceProgress.get(raceId)
      if (progress && progress.order.length > 0) {
        return progress.order[0] // Return the ID of the leader
      }
      return null
    }
  },
  
  actions: {
    addSimulationController(raceId: string, controller: SimulationController) {
      this.controllers.set(raceId, controller)
      this.raceStatus.set(raceId, 'pending')
    },
    
    removeSimulationController(raceId: string) {
      const controller = this.controllers.get(raceId)
      if (controller) {
        controller.stop()
        this.controllers.delete(raceId)
        this.activeRaces.delete(raceId)
        this.raceStatus.delete(raceId)
        this.speedMultipliers.delete(raceId)
        this.raceProgress.delete(raceId)
      }
    },
    
    startSimulation(raceId: string) {
      const controller = this.controllers.get(raceId)
      if (controller) {
        controller.start()
        this.activeRaces.add(raceId)
        this.raceStatus.set(raceId, 'running')
      }
    },
    
    stopSimulation(raceId: string) {
      const controller = this.controllers.get(raceId)
      if (controller) {
        controller.stop()
        this.raceStatus.set(raceId, 'aborted')
      }
    },
    
    finishSimulation(raceId: string) {
      this.raceStatus.set(raceId, 'finished')
      this.activeRaces.delete(raceId)
    },
    
    setSpeedMultiplier(raceId: string, multiplier: number) {
      this.speedMultipliers.set(raceId, multiplier)
    },
    
    updateRaceProgress(raceId: string, progress: {
      progressByRunner: Record<string, number>
      order: string[]
      gaps: Record<string, number>
      etaMs: number
    }) {
      this.raceProgress.set(raceId, progress)
    },
    
    getRaceProgress(raceId: string) {
      return this.raceProgress.get(raceId)
    },
    
    resetSimulation(raceId: string) {
      // Ensure smooth transition by properly cleaning up before resetting
      const controller = this.controllers.get(raceId)
      if (controller) {
        controller.stop()
      }
      this.activeRaces.delete(raceId)
      this.raceStatus.set(raceId, 'pending')
      this.raceProgress.delete(raceId)
    },
    
    resetAllSimulations() {
      // Ensure all simulations are properly stopped before clearing
      for (const [raceId, controller] of this.controllers.entries()) {
        controller.stop()
      }
      this.controllers.clear()
      this.activeRaces.clear()
      this.raceStatus.clear()
      this.speedMultipliers.clear()
      this.raceProgress.clear()
    }
  }
})