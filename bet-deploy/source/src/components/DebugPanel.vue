<template>
  <div v-if="showDebug" class="fixed bottom-4 right-4 z-50 w-full max-w-md">
    <div class="bg-surface-raised rounded-lg shadow-card border border-surface-sunken">
      <div class="flex justify-between items-center p-4 border-b border-surface-sunken">
        <h3 class="text-lg font-bold text-brand-primary">API Data Debugger</h3>
        <button 
          @click="closePanel" 
          class="text-text-muted hover:text-text-base"
          aria-label="Close debugger"
        >
          ✕
        </button>
      </div>
      
      <div class="p-4 max-h-96 overflow-y-auto">
        <div class="mb-4">
          <h4 class="font-bold text-text-base mb-2">Raw API Response:</h4>
          <pre class="text-xs bg-surface-sunken p-3 rounded overflow-x-auto">{{ formattedData }}</pre>
        </div>
        
        <div class="mb-4">
          <h4 class="font-bold text-text-base mb-2">Request Info:</h4>
          <div class="text-sm space-y-1">
            <p><span class="font-medium">Endpoint:</span> https://api.neds.com.au/rest/v1/racing/?method=nextraces&count=10</p>
            <p><span class="font-medium">Last Updated:</span> {{ lastUpdated }}</p>
            <p><span class="font-medium">Status:</span> <span :class="statusClass">{{ store.loadState }}</span></p>
            <p v-if="store.errorMessage"><span class="font-medium">Error:</span> {{ store.errorMessage }}</p>
          </div>
        </div>
        
        <div>
          <h4 class="font-bold text-text-base mb-2">Race Statistics:</h4>
          <div class="text-sm space-y-1">
            <p>{{ store.races.length }} races in store</p>
            <p>{{ store.nextFive.length }} races displayed</p>
            <p>{{ activeRaceCount }} active races</p>
            <p>{{ expiredRaceCount }} expired races (not shown)</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRacesStore } from '../stores/races'

const props = defineProps<{
  showDebug: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useRacesStore()
const lastUpdated = ref<string>('Never')
const unsubscribe = ref<(() => void) | null>(null)

// Format the raw data for display
const formattedData = computed(() => {
  try {
    if (store.races.length === 0) {
      return 'No data available'
    }
    return JSON.stringify(store.races, null, 2)
  } catch (e) {
    return 'Error formatting data'
  }
})

// Calculate race statistics
const activeRaceCount = computed(() => {
  return store.races.filter(race => !isRaceExpired(race)).length
})

const expiredRaceCount = computed(() => {
  return store.races.filter(race => isRaceExpired(race)).length
})

// Check if a race is expired
const isRaceExpired = (race: any) => {
  const now = Date.now()
  return now >= (race.advertised_start_ms + 60000)
}

// Status class for styling
const statusClass = computed(() => {
  switch (store.loadState) {
    case 'ready':
      return 'text-success'
    case 'error':
      return 'text-danger'
    case 'loading':
      return 'text-warning'
    default:
      return 'text-text-base'
  }
})

const closePanel = () => {
  emit('close')
}

// Update the last updated time
const updateLastUpdated = () => {
  lastUpdated.value = new Date().toLocaleTimeString()
}

// Watch for changes in the races data
onMounted(() => {
  // Set initial update time
  updateLastUpdated()
  
  // Subscribe to store changes
  unsubscribe.value = store.$subscribe(() => {
    updateLastUpdated()
  })
})

onUnmounted(() => {
  // Clean up subscription
  if (unsubscribe.value) {
    unsubscribe.value()
  }
})
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 300px;
  overflow-y: auto;
}
</style>