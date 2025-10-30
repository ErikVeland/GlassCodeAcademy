<template>
  <div class="p-3 flex-grow relative z-10">
    <div class="space-y-2">
      <!-- We need to convert the odds to string for RunnerRow -->
      <RunnerRow 
        v-for="(runner, index) in runnersForDisplay"
        :key="runner.id"
        :runner="runner"
        :race-id="raceId"
        :race-name="raceName"
        :race-number="raceNumber"
        :is-expired="isExpired"
        :tabindex="0"
        @add-to-betslip="handleAddToBetslip"
      />
      <!-- Show a message when no runners are available (not in simulation mode) -->
      <div 
        v-if="(!showGame || !useSimulatedData) && runnersForDisplay.length === 0" 
        class="text-center py-4 text-text-muted"
      >
        Runner information not available in API mode
      </div>
      <!-- Show a message when runners are missing in simulation mode -->
      <div 
        v-else-if="showGame && useSimulatedData && runnersForDisplay.length === 0" 
        class="text-center py-4 text-text-muted"
      >
        No runners available for this race
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RunnerRow from './RunnerRow.vue'

const props = defineProps<{
  raceId: string
  raceName: string
  raceNumber: number
  isExpired?: boolean
  showGame: boolean
  useSimulatedData: boolean
  runnersForDisplay: any[]
}>()

const emit = defineEmits<{
  (e: 'add-to-betslip', runner: any): void
}>()

const handleAddToBetslip = (runner: any) => {
  emit('add-to-betslip', runner)
}
</script>