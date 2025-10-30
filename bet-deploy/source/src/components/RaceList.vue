<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRacesStore } from '../stores/races'
import RaceColumn from './RaceColumn.vue'

const { t } = useI18n()

const store = useRacesStore()
const retryButton = ref<HTMLButtonElement | null>(null)
const expiringRaces = ref<Set<string>>(new Set())
const newRaces = ref<Set<string>>(new Set())

// Define emit
const emit = defineEmits<{
  (e: 'open-betslip', payload: { race: any; runner: any }): void
}>()

// Show all 5 races in a grid
const visibleRaces = computed(() => {
  const races = store.nextFive.slice(0, 5); // Show all 5 races
  // Visible races computed
  // Store state in RaceList
  // Store races in RaceList
  // Store loadState in RaceList
  // Next five in RaceList
  return races;
})

const retryFetch = () => {
  // Retrying fetch...
  store.fetchRaces()
}

// Handle adding a runner to the betslip
const handleAddToBetslip = (payload: { race: any; runner: any }) => {
  // Emit event to parent to open the betslip drawer and add the selection
  emit('open-betslip', payload)
}

// Track expiring and new races
const previousRaces = ref<string[]>([])
watch(() => store.nextFive, (currentRaces, oldRaces) => {
  // Next five changed
  const currentRaceIds = currentRaces.map(r => r.id)
  
  // Find races that were removed
  const removedRaceIds = previousRaces.value.filter(id => !currentRaceIds.includes(id))
  
  // Find races that were added
  const addedRaceIds = currentRaceIds.filter(id => !previousRaces.value.includes(id))
  
  // Add removed races to expiring set
  removedRaceIds.forEach(id => expiringRaces.value.add(id))
  
  // Add new races to new set
  addedRaceIds.forEach(id => newRaces.value.add(id))
  
  // Clear expired races after animation
  if (removedRaceIds.length > 0) {
    setTimeout(() => {
      expiringRaces.value.clear()
    }, 500)
  }
  
  // Clear new races after animation
  if (addedRaceIds.length > 0) {
    setTimeout(() => {
      newRaces.value.clear()
    }, 1000)
  }
  
  // Update previous races
  previousRaces.value = currentRaceIds
}, { deep: true })

// Function to check if a race is expired
const isRaceExpired = (race: any) => {
  const now = Date.now()
  return now >= (race.advertised_start_ms + 60000)
}

// Clean up interval when component unmounts
import { onUnmounted, onMounted } from 'vue'
onUnmounted(() => {
  // No more auto-rotation
})

onMounted(() => {
  // Initialize previous races
  previousRaces.value = store.nextFive.map(r => r.id)
  // RaceList mounted, initial nextFive:
  
  // Focus the retry button if it exists and there's an error
  if (store.loadState === 'error' && retryButton.value) {
    retryButton.value.focus()
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Loading state -->
    <div v-if="store.loadState === 'loading' && store.races.length === 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      <div v-for="i in 5" :key="i" class="bg-surface-raised rounded-2xl shadow-card overflow-hidden animate-pulse">
        <div class="h-48 bg-surface-sunken"></div>
        <div class="p-4">
          <div class="h-6 bg-surface-sunken rounded mb-2"></div>
          <div class="h-4 bg-surface-sunken rounded w-3/4"></div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="store.loadState === 'error'" class="text-center py-12">
      <div class="text-5xl mb-4">⚠️</div>
      <h3 class="text-xl font-bold mb-2">{{ $t('races.error') }}</h3>
      <p class="text-text-muted mb-4">{{ store.errorMessage }}</p>
      <button 
        ref="retryButton"
        @click="retryFetch"
        class="px-4 py-2 bg-brand-primary text-text-inverse rounded-lg hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
      >
        {{ $t('races.tryAgain') }}
      </button>
    </div>

    <!-- Empty state -->
    <div v-else-if="store.loadState === 'ready' && visibleRaces.length === 0" class="text-center py-12">
      <div class="text-5xl mb-4">📭</div>
      <h3 class="text-xl font-bold mb-2">{{ $t('races.noRaces') }}</h3>
      <p class="text-text-muted">{{ $t('races.checkBack') }}</p>
    </div>

    <!-- Race grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      <TransitionGroup name="race-list" tag="div" class="contents">
        <div 
          v-for="race in visibleRaces"
          :key="race.id"
          class="race-list-item"
        >
          <RaceColumn
            :race="race"
            :is-expired="isRaceExpired(race)"
            :class="{
              'opacity-50 scale-95': expiringRaces.has(race.id),
              'scale-105': newRaces.has(race.id)
            }"
            @add-to-betslip="handleAddToBetslip"
          />
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.race-list-move,
.race-list-enter-active,
.race-list-leave-active {
  transition: all 0.5s ease;
}

.race-list-enter-from,
.race-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.race-list-leave-active {
  position: absolute;
}

/* Add specific styling for race list items */
.race-list-item {
  transition: all 0.5s ease;
}
</style>