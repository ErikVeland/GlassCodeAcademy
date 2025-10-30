<template>
  <div v-if="betsStore.showGame && betsStore.useSimulatedData" class="bg-surface-sunken rounded-lg p-4 mb-4">
    <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
      <h3 class="text-lg font-semibold text-text-base">Simulation Controls</h3>
      
      <!-- Race Status Indicator -->
      <div class="flex items-center">
        <span class="text-sm text-text-muted mr-2">Status:</span>
        <span 
          class="px-2 py-1 rounded text-xs font-medium"
          :class="statusClass"
        >
          {{ raceStatusDisplay }}
        </span>
      </div>
    </div>
    
    <!-- Control Buttons -->
    <div class="flex flex-wrap gap-2 mb-3">
      <button
        v-if="raceStatus === 'live'"
        @click="pauseRace"
        class="px-3 py-1 bg-warning text-text-inverse rounded text-sm hover:bg-opacity-90"
      >
        Pause
      </button>
      
      <button
        v-if="raceStatus === 'live' || raceStatus === 'finished'"
        @click="resetRace"
        class="px-3 py-1 bg-brand-primary text-text-inverse rounded text-sm hover:bg-opacity-90"
      >
        Reset
      </button>
      
      <button
        @click="toggleDebugInfo"
        class="px-3 py-1 bg-surface-raised text-text-base rounded text-sm hover:bg-opacity-90"
      >
        {{ showDebugInfo ? 'Hide' : 'Show' }} Debug
      </button>
    </div>
    
    <!-- Speed Control -->
    <div class="mb-3">
      <label class="block text-text-base text-sm mb-1">Simulation Speed: {{ speedMultiplier }}x</label>
      <input
        type="range"
        min="0.5"
        max="3"
        step="0.5"
        v-model.number="speedMultiplier"
        @change="updateSpeed"
        class="w-full accent-brand-primary"
        :disabled="raceStatus === 'finished'"
      />
      <div class="flex justify-between text-xs text-text-muted">
        <span>0.5x</span>
        <span>1x</span>
        <span>1.5x</span>
        <span>2x</span>
        <span>2.5x</span>
        <span>3x</span>
      </div>
    </div>
    
    <!-- Debug Information -->
    <div v-if="showDebugInfo" class="bg-surface-raised rounded p-3 text-xs">
      <h4 class="font-medium text-text-base mb-2">Debug Information</h4>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <div class="text-text-muted">Race ID:</div>
          <div class="text-text-base truncate">{{ race.id }}</div>
        </div>
        <div>
          <div class="text-text-muted">Status:</div>
          <div class="text-text-base">{{ raceStatus }}</div>
        </div>
        <div>
          <div class="text-text-muted">Start Time:</div>
          <div class="text-text-base">{{ new Date(race.advertised_start_ms).toLocaleTimeString() }}</div>
        </div>
        <div>
          <div class="text-text-muted">Current Time:</div>
          <div class="text-text-base">{{ currentTime }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useBetsStore } from '../stores/bets'
import { type RaceSummary } from '../stores/races'

const props = defineProps<{
  race: RaceSummary
}>()

const emit = defineEmits<{
  (e: 'pause'): void
  (e: 'reset'): void
  (e: 'speed-change', speed: number): void
}>()

const betsStore = useBetsStore()

// State
const showDebugInfo = ref(false)
const speedMultiplier = ref(1)
const currentTime = ref(new Date().toLocaleTimeString())
const raceStatus = ref<string>('countdown') // Using string type to avoid TypeScript issues

// Computed properties
const raceStatusDisplay = computed(() => {
  switch (raceStatus.value) {
    case 'countdown': return 'Countdown'
    case 'starting_soon': return 'Starting Soon'
    case 'live': return 'Live'
    case 'finished': return 'Finished'
    default: return 'Unknown'
  }
})

const statusClass = computed(() => {
  switch (raceStatus.value) {
    case 'starting_soon':
      return 'bg-warning text-text-inverse'
    case 'live':
      return 'bg-danger text-text-inverse'
    case 'finished':
      return 'bg-success text-text-inverse'
    default: // countdown
      return 'bg-surface-raised text-text-base'
  }
})

// Methods
const pauseRace = () => {
  emit('pause')
}

const resetRace = () => {
  emit('reset')
}

const toggleDebugInfo = () => {
  showDebugInfo.value = !showDebugInfo.value
}

const updateSpeed = () => {
  emit('speed-change', speedMultiplier.value)
}

// Update current time every second
let timeInterval: number | null = null

onMounted(() => {
  timeInterval = window.setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString()
  }, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>