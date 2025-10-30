<template>
  <div 
    v-if="!error"
    class="bg-surface-raised rounded-xl2 shadow-card overflow-hidden transition-all duration-500 animate-bounce-in flex flex-col h-full relative border-2 border-surface"
    :class="{ 
      'ring-2 ring-brand-primary': isActive, 
      'opacity-50 pointer-events-none': isExpired,
      'animate-pulse-slow': raceStatus === 'starting_soon',
      'border-warning': raceStatus === 'starting_soon',
      'border-danger': raceStatus === 'live',
      'border-success': raceStatus === 'finished'
    }"
    :data-race-id="race.id"
    :data-race-status="raceStatus"
    :tabindex="isActive ? 0 : -1"
    @keydown="handleKeyDown"
    :aria-label="`Race ${race.race_number} at ${race.meeting_name}`"
    role="region"
  >
    <!-- Full card background with subtle race-type color overlay (10% opacity) -->
    <div 
      class="absolute inset-0 rounded-xl2 pointer-events-none select-none opacity-10"
      :class="{
        'bg-horse': race.category_id === CATEGORY_IDS.HORSE,
        'bg-greyhound': race.category_id === CATEGORY_IDS.GREYHOUND,
        'bg-harness': race.category_id === CATEGORY_IDS.HARNESS
      }"
    ></div>
    
    <!-- Full card background category icon -->
    <div class="absolute bottom-0 right-0 opacity-10 w-full h-full z-0 overflow-hidden pointer-events-none select-none">
      <span v-if="race.category_id === CATEGORY_IDS.HORSE" class="text-[120px] block absolute bottom-[-25%] right-[-15%]">🏇</span>
      <span v-else-if="race.category_id === CATEGORY_IDS.GREYHOUND" class="text-[120px] block absolute bottom-[-25%] right-[-15%]">🐕</span>
      <span v-else-if="race.category_id === CATEGORY_IDS.HARNESS" class="text-[120px] block absolute bottom-[-25%] right-[-15%]">🛞</span>
    </div>
    
    <RaceHeader 
      :meeting-name="race.meeting_name"
      :race-number="race.race_number"
      :category-id="race.category_id"
      :start-time="race.advertised_start_ms"
      :is-expired="isExpired"
      :race-id="race.id"
      :race-finished="raceFinished"
    />
    
    <SimulationControlsSection
      :race="race"
      :show-game="betsStore.showGame"
      :use-simulated-data="betsStore.useSimulatedData"
      :show-debug-controls="showDebugControls"
      @start-race-simulation="startRaceSimulation"
      @reset-race-simulation="resetRaceSimulation"
    />
    
    <RunnersSection
      :race-id="race.id"
      :race-name="race.meeting_name"
      :race-number="race.race_number"
      :is-expired="!!isExpired"
      :show-game="betsStore.showGame"
      :use-simulated-data="betsStore.useSimulatedData"
      :runners-for-display="runnersForDisplay"
      @add-to-betslip="handleAddToBetslip"
    />
    
    <OddsTrendSection
      :race-id="race.id"
      :show-game="betsStore.showGame"
      :is-expired="isExpired"
      :race-status="raceStatus"
      :show-odds-chart="showOddsChart"
      @toggle-odds-chart="toggleOddsChart"
    />
    
    <RaceResults 
      v-if="raceResult && !isExpired && betsStore.showGame && raceFinished"
      :race-id="race.id"
      :runners="runnersForBetPlacer"
      :race-result="raceResult"
    />
  </div>
  
  <!-- Error boundary -->
  <div v-else class="bg-surface-raised rounded-xl2 shadow-card overflow-hidden flex flex-col h-full relative border border-danger p-4">
    <div class="text-danger font-bold mb-2">Error Loading Race</div>
    <div class="text-text-muted text-sm mb-4">{{ error }}</div>
    <button 
      @click="retryLoad"
      class="px-3 py-1 bg-brand-primary text-text-inverse rounded text-sm hover:bg-opacity-90"
    >
      Retry
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { type RaceSummary, CATEGORY_IDS } from '../stores/races'
import { useBetsStore } from '../stores/bets'
import { initializeOddsSimulation, updateOdds, getSimulatedRunners, resetSimulation, generateRandomizedRunners, type SimulatedRunner } from '../composables/useOddsSimulation'
import { useOddsUpdater } from '../composables/useOddsUpdater'
import { useRaceSimulation } from '../composables/useRaceSimulation'
import { useSimulationManager } from '../composables/useSimulationManager'
import { useCountdown } from '../composables/useCountdown'
import { type Tick, type Result } from '../game/simulatedRace'
import RaceHeader from './RaceHeader.vue'
import RaceResults from './RaceResults.vue'
import OddsTrendSection from './OddsTrendSection.vue'
import RunnersSection from './RunnersSection.vue'
import SimulationControlsSection from './SimulationControlsSection.vue'
import { useSimulationStore } from '../stores/simulation'

const props = defineProps<{
  race: RaceSummary
  isActive?: boolean
  isExpired?: boolean
}>()

const emit = defineEmits<{
  (e: 'navigate-next'): void
  (e: 'navigate-prev'): void
  (e: 'select'): void
  (e: 'add-to-betslip', payload: { race: RaceSummary; runner: any }): void
  (e: 'race-started'): void
  (e: 'race-finished'): void
}>()

const betsStore = useBetsStore()
const { registerCountdownRace, unregisterCountdownRace } = useOddsUpdater()
const { createSimulation, getSimulation, removeSimulation, startSimulation, stopSimulation, resetSimulation: resetRaceSimulationStore } = useRaceSimulation()
const { canStartSimulation, incrementSimulationCount, decrementSimulationCount, calculateOptimalTickInterval } = useSimulationManager()
const { formattedTime, isStartingSoon, isInProgress } = useCountdown(props.race.advertised_start_ms)

// State for odds chart dropdown
const showOddsChart = ref(false)
const toggleOddsChart = () => {
  showOddsChart.value = !showOddsChart.value
}

// Show debug controls only when debug mode is enabled
const showDebugControls = computed(() => {
  return betsStore.showGame && betsStore.useSimulatedData && window.location.search.includes('debug')
})

// Race simulation controller
let simulationController: any = null

// Use global simulation manager for concurrent simulation limit

// Race result - only shown after simulation completes
const raceResult = ref<{ placings: string[] } | null>(null)

// Track if race has finished
const raceFinished = ref(false)

// Track if race is live (simulation started)
const raceLive = ref(false)

// Error handling
const error = ref<string | null>(null)

// Cache for runners display to ensure proper reactivity

// Computed race status with smooth transitions
const raceStatus = computed(() => {
  if (props.isExpired) return 'finished'
  // Show 'finished' status when race has completed
  if (raceFinished.value) return 'finished'
  // Only show 'live' status when race has actually started (countdown finished) and not finished
  if (isInProgress.value) return 'live'
  if (isStartingSoon.value) return 'starting_soon'
  return 'countdown'
})

// Watch for race status changes to manage odds updates
watch([isInProgress, isStartingSoon, () => props.isExpired], ([inProgress, startingSoon, isExpired]) => {
  // Race status changed for race
  
  // Check if race is in countdown status (upcoming race)
  // Odds should update only when race is upcoming (countdown) and not expired
  // DO NOT allow odds updates when "starting soon" - odds must be locked
  const isCountdown = !isExpired && !inProgress && !startingSoon && !raceFinished.value;
  
  if (isCountdown && betsStore.showGame && betsStore.useSimulatedData) {
    // Register race for global odds updates
    registerCountdownRace(props.race.id);
  } else {
    // Unregister race from global odds updates
    unregisterCountdownRace(props.race.id);
  }
}, { immediate: true });

// Start race simulation when countdown ends with smooth transition
watch(isInProgress, (inProgress) => {
  // inProgress changed for race to inProgress
  
  if (inProgress && betsStore.showGame && betsStore.useSimulatedData && !raceFinished.value && !raceLive.value) {
    // Start the simulation when countdown finishes
    if (simulationController) {
      try {
        startSimulation(props.race.id)
        raceLive.value = true
        // Emit race started event
        emit('race-started')
        
        // Dispatch race start event for live ticker
        const event = new CustomEvent('race-start', {
          detail: {
            raceName: props.race.meeting_name,
            raceNumber: props.race.race_number,
            userBets: [] // We would need to implement user bet tracking here
          }
        });
        window.dispatchEvent(event);
      } catch (err) {
        // Enhanced error handling with user-friendly error messages and retry option
        const errorMessage = err instanceof Error ? err.message : String(err)
        error.value = `Failed to start race simulation: ${errorMessage}. Please try again.`
        // Only log critical errors
        if (err instanceof Error && err.message.includes('simulation')) {
          console.error('Critical error starting race simulation:', err)
        }
      }
    }
  } else if (!inProgress && raceLive.value && !raceFinished.value) {
    // Race is no longer in progress but was marked as live - ensure proper cleanup
    raceLive.value = false
  }
}, { immediate: true })

// Compute runners with significant odds changes for visual indicators
const runnersWithSignificantChanges = computed(() => {
  if (!betsStore.showGame || !betsStore.useSimulatedData) return []
  
  // For starting soon races, don't show any runners with trends (odds are locked)
  if (raceStatus.value === 'starting_soon') return []
  
  const runners = getSimulatedRunners(props.race.id)
  // Filter to only show runners with significant odds changes (trend is not 'none')
  return runners.filter((runner: SimulatedRunner) => runner.oddsTrend !== 'none')
})

// Retry loading the race simulation
const retryLoad = () => {
  error.value = null
  initializeRaceSimulation()
}

// Update race progress in the simulation store
const updateRaceProgress = (raceId: string, progress: {
  progressByRunner: Record<string, number>
  order: string[]
  gaps: Record<string, number>
  etaMs: number
}) => {
  const simulationStore = useSimulationStore()
  simulationStore.updateRaceProgress(raceId, progress)
}

// Initialize race simulation
const initializeRaceSimulation = () => {
  // Initializing race simulation for race
  
  // Only initialize in simulation mode
  if (!betsStore.showGame || !betsStore.useSimulatedData) {
    // Not in simulation mode, skipping initialization
    return
  }
  
  // Check concurrent simulation limit using global manager
  if (!canStartSimulation()) {
    // Too many active simulations, skipping initialization for now
    return
  }
  
  try {
    // Initializing race simulation for race
    // Clean up any existing simulation
    cleanupSimulation()
    
    // Generate randomized runners based on race category with initial odds
    const runners = generateRandomizedRunners(props.race.id, props.race.category_id)
    
    // Initialize odds simulation
    initializeOddsSimulation(props.race.id, runners)
    
    // Create race simulation
    const raceInput = {
      id: props.race.id,
      meetingName: props.race.meeting_name,
      raceNumber: props.race.race_number,
      categoryId: props.race.category_id,
      advertisedStartMs: props.race.advertised_start_ms,
      runners: runners.map((runner: SimulatedRunner) => ({
        id: runner.id,
        number: runner.number,
        name: runner.name,
        decimalOdds: typeof runner.odds === 'number' ? runner.odds : 6.0
      }))
    }
    
    // Calculate optimal tick interval using global simulation manager
    const tickMs = calculateOptimalTickInterval();
    
    simulationController = createSimulation(raceInput, undefined, tickMs)
    
    // Increment active simulation count using global manager
    incrementSimulationCount();
    
    // Set up tick handler for race progress updates only
    // DO NOT update odds during live race - odds are locked once race starts
    simulationController.onTick((tick: Tick) => {
      try {
        // Race tick for race with progress and order
        
        // Update race progress in the simulation store
        updateRaceProgress(props.race.id, {
          progressByRunner: tick.progressByRunner,
          order: tick.order,
          gaps: tick.gaps,
          etaMs: tick.etaMs
        });
      } catch (err) {
        error.value = err instanceof Error ? err.message : String(err)
        // Only log critical errors
        if (err instanceof Error && err.message.includes('tick')) {
          console.error('Critical error handling race tick:', err)
        }
      }
    })
    
    // Set up finish handler for results
    simulationController.onFinish((result: Result) => {
      try {
        // Race finished for race with result
        // Set race result to show after simulation completes
        raceResult.value = {
          placings: result.placings
        }
        
        // Mark race as finished
        raceFinished.value = true
        raceLive.value = false
        
        // Decrement active simulation count using global manager
        decrementSimulationCount();
        
        // Emit race finished event
        emit('race-finished')
        
        // Settle any bets for this race
        const settlements = betsStore.settleRace(props.race.id, { placings: result.placings })
        
        // Check if user won any bets and trigger celebration animation
        if (settlements && settlements.length > 0) {
          const winningSettlements = settlements.filter(s => s.result === 'WON')
          if (winningSettlements.length > 0) {
            // Trigger win celebration
            const event = new CustomEvent('win-celebration', { 
              detail: { 
                winAmount: winningSettlements.reduce((sum, s) => sum + s.payout, 0) 
              } 
            })
            window.dispatchEvent(event)
          }
        }
      
        // Dispatch race finish event for live ticker
        const finishEvent = new CustomEvent('race-finish', {
          detail: {
            raceId: props.race.id,
            message: `${props.race.meeting_name} R${props.race.race_number} has finished`,
            winner: result.placings.length > 0 ? { id: result.placings[0] } : null,
            userBets: [] // We would need to implement user bet tracking here
          }
        });
        window.dispatchEvent(finishEvent);
      } catch (err) {
        error.value = err instanceof Error ? err.message : String(err)
        // Only log critical errors
        if (err instanceof Error && err.message.includes('finish')) {
          console.error('Critical error finishing race:', err)
        }
      }
    })
  } catch (err) {
    // Enhanced error handling with user-friendly error messages
    const errorMessage = err instanceof Error ? err.message : String(err)
    error.value = `Failed to initialize race simulation: ${errorMessage}`
    // Only log critical errors
    if (err instanceof Error && err.message.includes('simulation')) {
      console.error('Critical error initializing race simulation:', err)
    }
  }
}

// Initialize simulation on mount
onMounted(() => {
  try {
    // RaceColumn mounted for race
    // Only initialize simulation in simulation mode
    if (betsStore.showGame && betsStore.useSimulatedData) {
      initializeRaceSimulation()
    }
  } catch (err) {
    // Enhanced error handling with user-friendly error messages
    const errorMessage = err instanceof Error ? err.message : String(err)
    error.value = `Failed to mount race component: ${errorMessage}`
    // Only log critical errors
    if (err instanceof Error && err.message.includes('mount')) {
      console.error('Critical error mounting race component:', err)
    }
  }
})

// Also start race simulation when manually triggered (for testing)
const startRaceSimulation = () => {
  // Manual start race simulation requested for race
  
  if (betsStore.showGame && betsStore.useSimulatedData && !raceFinished.value && !raceLive.value) {
    // Check concurrent simulation limit using global manager
    if (!canStartSimulation()) {
      // Too many active simulations, cannot start another one
      error.value = 'Too many active simulations. Please wait for some to finish.';
      return;
    }
    
    // Mark race as live
    raceLive.value = true
    // Increment active simulation count using global manager
    incrementSimulationCount();
    // Emit race started event
    emit('race-started')
  }
}

// Reset race simulation
const resetRaceSimulation = () => {
  try {
    cleanupSimulation()
    initializeRaceSimulation()
  } catch (err) {
    // Enhanced error handling with user-friendly error messages
    const errorMessage = err instanceof Error ? err.message : String(err)
    error.value = `Failed to reset race simulation: ${errorMessage}`
    // Only log critical errors
    if (err instanceof Error && err.message.includes('reset')) {
      console.error('Critical error resetting race simulation:', err)
    }
  }
}

// Clean up simulation
const cleanupSimulation = () => {
  try {
    if (simulationController) {
      stopSimulation(props.race.id)
      simulationController = null
    }
    resetSimulation(props.race.id)
    removeSimulation(props.race.id)
    raceResult.value = null
    raceFinished.value = false
    raceLive.value = false
    
    // Decrement active simulation count using global manager
    decrementSimulationCount();
  } catch (err) {
    // Enhanced error handling with user-friendly error messages
    const errorMessage = err instanceof Error ? err.message : String(err)
    error.value = `Failed to clean up race simulation: ${errorMessage}`
    // Only log critical errors
    if (err instanceof Error && err.message.includes('cleanup')) {
      console.error('Critical error cleaning up simulation:', err)
    }
  }
}

// Watch for changes in simulation mode
watch(() => betsStore.showGame && betsStore.useSimulatedData, (newVal, oldVal) => {
  // Simulation mode changed for race from oldVal to newVal
  
  if (newVal && !oldVal) {
    // Switching to simulation mode
    try {
      // Check concurrent simulation limit using global manager
      if (!canStartSimulation()) {
        // Too many active simulations, cannot switch to simulation mode
        error.value = 'Too many active simulations. Please wait for some to finish.';
        return;
      }
      
      // Initializing race simulation for race
      initializeRaceSimulation()
      // Make sure the chart knows the simulation is available
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('simulation-initialized', { detail: { raceId: props.race.id } }));
      }, 100);
    } catch (err) {
      // Enhanced error handling with user-friendly error messages
      const errorMessage = err instanceof Error ? err.message : String(err)
      error.value = `Failed to switch to simulation mode: ${errorMessage}`
      // Only log critical errors
      if (err instanceof Error && err.message.includes('simulation')) {
        console.error('Critical error switching to simulation mode:', err)
      }
    }
  } else if (!newVal && oldVal) {
    // Switching to non-simulation mode - clean up simulation
    try {
      // Cleaning up simulation for race
      cleanupSimulation()
    } catch (err) {
      // Enhanced error handling with user-friendly error messages
      const errorMessage = err instanceof Error ? err.message : String(err)
      error.value = `Failed to switch to API mode: ${errorMessage}`
      // Only log critical errors
      if (err instanceof Error && err.message.includes('API')) {
        console.error('Critical error switching to API mode:', err)
      }
    }
  }
}, { immediate: true })

// Clean up on unmount
onUnmounted(() => {
  try {
    cleanupSimulation()
    // Unregister from global odds updates
    unregisterCountdownRace(props.race.id)
    // Clean up cache - removed due to reactivity issues
    // runnersForDisplayCache.delete(props.race.id)
  } catch (err) {
    // Only log critical errors
    if (err instanceof Error && err.message.includes('unmount')) {
      console.error('Critical error during component unmount:', err)
    }
  }
})

// Get runners based on simulation mode
// We need to convert the odds to the correct type for BetPlacer
const runnersForBetPlacer = computed(() => {
  if (betsStore.showGame && betsStore.useSimulatedData) {
    // Return simulated runners with dynamic odds
    return getSimulatedRunners(props.race.id)
  } else {
    // When not in simulation mode, we should not show any runners
    // as they should come from the API
    return []
  }
})

// We need to convert the odds to string for RunnerRow
const runnersForDisplay = computed(() => {
  // In API mode, we don't show any runners
  if (!betsStore.showGame || !betsStore.useSimulatedData) {
    return []
  }
  
  // In simulation mode, show simulated runners
  const runners = getSimulatedRunners(props.race.id)
  // Got simulated runners for race
  
  const formattedRunners = runners.map((runner: SimulatedRunner) => ({
    ...runner,
    odds: runner.odds === 'SP' ? 'SP' : runner.odds.toString(),
    // For non-simulation mode, we always show 'none' trend
    oddsTrend: (!betsStore.showGame || !betsStore.useSimulatedData) ? 'none' : runner.oddsTrend
  }));
  
  // Updating runners for display for race
  
  return formattedRunners;
})

const handleAddToBetslip = (runner: any) => {
  if (!props.isExpired && betsStore.showGame) {
    // Emit event to parent to handle adding to betslip
    emit('add-to-betslip', { race: props.race, runner })
  }
}

// Handle keyboard navigation
const handleKeyDown = (event: KeyboardEvent) => {
  if (!props.isActive) return
  
  switch (event.key) {
    case 'ArrowRight':
      event.preventDefault()
      emit('navigate-next')
      break
    case 'ArrowLeft':
      event.preventDefault()
      emit('navigate-prev')
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      emit('select')
      break
    case 'b':
      // Quick bet placement shortcut
      if (betsStore.showGame && !props.isExpired && runnersForBetPlacer.value.length > 0) {
        event.preventDefault()
        handleAddToBetslip(runnersForBetPlacer.value[0])
      }
      break
  }
}
</script>
