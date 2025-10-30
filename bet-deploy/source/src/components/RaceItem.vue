<template>
  <div 
    class="bg-surface-raised rounded-xl2 p-6 shadow-card transition-transform hover:scale-[1.02]"
    :class="raceCategoryClass"
  >
    <div class="flex justify-between items-start">
      <div>
        <h3 class="text-lg font-semibold text-text-base truncate max-w-[70%]">
          {{ race.meeting_name }}
        </h3>
        <p class="text-text-muted mt-1">
          Race {{ race.race_number }}
        </p>
      </div>
      <div 
        class="px-3 py-1 rounded-full text-xs font-medium"
        :class="categoryBadgeClass"
      >
        {{ categoryLabel }}
      </div>
    </div>

    <div class="mt-6">
      <CountdownTimer :start-time="race.advertised_start_ms" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { type RaceSummary, CATEGORY_IDS } from '../stores/races'
import CountdownTimer from './CountdownTimer.vue'

const props = defineProps<{
  race: RaceSummary
}>()

const categoryLabel = computed(() => {
  switch (props.race.category_id) {
    case CATEGORY_IDS.HORSE:
      return 'Horse'
    case CATEGORY_IDS.GREYHOUND:
      return 'Greyhound'
    case CATEGORY_IDS.HARNESS:
      return 'Harness'
    default:
      return 'Unknown'
  }
})

const raceCategoryClass = computed(() => {
  switch (props.race.category_id) {
    case CATEGORY_IDS.HORSE:
      return 'border-l-4 border-l-brand-primary'
    case CATEGORY_IDS.GREYHOUND:
      return 'border-l-4 border-l-brand-accent'
    case CATEGORY_IDS.HARNESS:
      return 'border-l-4 border-l-success'
    default:
      return 'border-l-4 border-l-text-muted'
  }
})

const categoryBadgeClass = computed(() => {
  switch (props.race.category_id) {
    case CATEGORY_IDS.HORSE:
      return 'bg-brand-primary bg-opacity-20 text-brand-primary'
    case CATEGORY_IDS.GREYHOUND:
      return 'bg-brand-accent bg-opacity-20 text-brand-accent'
    case CATEGORY_IDS.HARNESS:
      return 'bg-success bg-opacity-20 text-success'
    default:
      return 'bg-text-muted bg-opacity-20 text-text-muted'
  }
})
</script>