<template>
  <!-- Odds Trend Chart - Always visible for active races in simulation mode -->
  <div class="px-3 pb-3 relative z-10" v-if="showLiveChart">
    <div class="border-t border-surface pt-3">
      <div class="flex items-center justify-between w-full py-2 text-text-base font-medium mb-2">
        <span>Odds Movements</span>
      </div>
      <div class="mt-2">
        <OddsTrendChart :race-id="raceId" />
      </div>
    </div>
  </div>

  <!-- Odds Trend Chart with dropdown curtain for non-live races -->
  <div class="px-3 pb-3 relative z-10" v-else-if="showDropdownChart">
    <div class="border-t border-surface pt-3">
      <div class="flex items-center justify-between w-full py-2 text-text-base font-medium mb-2">
        <button 
          @click="toggleOddsChart"
          class="flex items-center"
        >
          <span>Odds Movements</span>
          <span :class="{'rotate-180': showOddsChart}" class="transition-transform ml-2">▼</span>
        </button>
      </div>
      <div v-show="showOddsChart" class="mt-2">
        <OddsTrendChart :race-id="raceId" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import OddsTrendChart from './OddsTrendChart.vue'

const props = defineProps<{
  raceId: string
  showGame: boolean
  isExpired?: boolean
  raceStatus: 'finished' | 'live' | 'starting_soon' | 'countdown'
  showOddsChart: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-odds-chart'): void
}>()

const showLiveChart = computed(() => {
  return props.showGame && !props.isExpired && props.raceStatus === 'live'
})

const showDropdownChart = computed(() => {
  return props.showGame && !props.isExpired
})

const toggleOddsChart = () => {
  emit('toggle-odds-chart')
}
</script>