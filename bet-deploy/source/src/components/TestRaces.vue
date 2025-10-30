<template>
  <div class="p-4 bg-surface-sunken rounded-lg">
    <h2 class="text-lg font-bold mb-4">Race Debug Info</h2>
    <div class="space-y-2">
      <p><strong>Load State:</strong> {{ store.loadState }}</p>
      <p><strong>Races Count:</strong> {{ store.races.length }}</p>
      <p><strong>Next Five Count:</strong> {{ store.nextFive.length }}</p>
      <p v-if="store.errorMessage" class="text-danger"><strong>Error:</strong> {{ store.errorMessage }}</p>
      <div v-if="store.races.length > 0">
        <h3 class="font-medium mt-4">First Race:</h3>
        <pre class="text-xs bg-surface p-2 rounded">{{ JSON.stringify(store.races[0], null, 2) }}</pre>
      </div>
      <button @click="fetchRaces" class="px-4 py-2 bg-brand-primary text-text-inverse rounded-lg">
        Fetch Races
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRacesStore } from '../stores/races'
import { onMounted } from 'vue'

const store = useRacesStore()

const fetchRaces = async () => {
  // Manually fetching races...
  try {
    await store.fetchRaces()
    // Fetch completed, races count: store.races.length
  } catch (error) {
    // Error fetching races: error
  }
}

onMounted(() => {
  // TestRaces component mounted
  // Initial store state: store
  
  // Try to fetch races on mount
  fetchRaces()
})
</script>