<template>
  <div>
    <div v-if="store.loadState === 'loading'" class="space-y-4">
      <!-- Skeleton loaders for meetings view -->
      <div 
        v-for="i in 3" 
        :key="i"
        class="bg-surface-raised rounded-xl2 p-6 animate-pulse"
      >
        <div class="h-6 bg-surface-sunken rounded w-1/3 mb-4"></div>
        <div class="space-y-3">
          <div class="h-4 bg-surface-sunken rounded w-full"></div>
          <div class="h-4 bg-surface-sunken rounded w-5/6"></div>
          <div class="h-4 bg-surface-sunken rounded w-4/6"></div>
        </div>
      </div>
    </div>

    <div v-else-if="store.loadState === 'error'" class="text-center py-12">
      <div class="text-danger text-lg font-medium mb-2">Error loading meetings</div>
      <div class="text-text-muted mb-4">{{ store.errorMessage }}</div>
      <button 
        @click="retryFetch"
        class="px-4 py-2 bg-brand-primary text-text-inverse rounded-lg hover:bg-opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand-primary"
        ref="retryButton"
      >
        Try Again
      </button>
    </div>

    <div v-else-if="Object.keys(store.racesByMeeting).length === 0" class="text-center py-12">
      <div class="text-text-muted text-lg">No meetings available</div>
      <div class="text-text-muted mt-2">Please check back later</div>
    </div>

    <div v-else class="space-y-6">
      <div 
        v-for="(races, meetingName, index) in store.racesByMeeting" 
        :key="meetingName"
        class="bg-surface-raised rounded-xl2 shadow-card overflow-hidden transition-all duration-300"
      >
        <button
          @click="toggleMeeting(meetingName)"
          class="w-full px-6 py-4 flex justify-between items-center bg-surface-sunken hover:bg-opacity-80 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
          :aria-expanded="expandedMeetings.has(meetingName)"
          :aria-controls="`meeting-${meetingName}`"
          @keydown="handleMeetingKeyDown($event, meetingName)"
          :title="meetingName"
        >
          <h2 class="text-xl font-bold text-text-base truncate">{{ meetingName }}</h2>
          <div class="flex items-center">
            <span class="text-text-muted mr-2">{{ races.length }} race{{ races.length !== 1 ? 's' : '' }}</span>
            <span 
              class="transform transition-transform duration-300"
              :class="{ 'rotate-180': expandedMeetings.has(meetingName) }"
            >
              ▼
            </span>
          </div>
        </button>

        <div
          :id="`meeting-${meetingName}`"
          class="transition-all duration-300 ease-in-out overflow-hidden"
          :class="{ 'max-h-0': !expandedMeetings.has(meetingName), 'max-h-screen': expandedMeetings.has(meetingName) }"
        >
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <RaceColumn
                v-for="race in races"
                :key="race.id"
                :race="race"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRacesStore } from '../stores/races'
import RaceColumn from './RaceColumn.vue'

const store = useRacesStore()
const expandedMeetings = ref<Set<string>>(new Set())
const retryButton = ref<HTMLButtonElement | null>(null)

const toggleMeeting = (meetingName: string) => {
  if (expandedMeetings.value.has(meetingName)) {
    expandedMeetings.value.delete(meetingName)
  } else {
    expandedMeetings.value.add(meetingName)
  }
}

const handleMeetingKeyDown = (event: KeyboardEvent, meetingName: string) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      toggleMeeting(meetingName)
      break
  }
}

const retryFetch = () => {
  store.fetchRaces()
}

// Expand the first meeting by default
onMounted(() => {
  // Use nextTick to ensure the store data is available
  setTimeout(() => {
    const meetings = Object.keys(store.racesByMeeting)
    if (meetings.length > 0) {
      expandedMeetings.value.add(meetings[0])
    }
  }, 0)
})

// Watch for changes in racesByMeeting and expand the first meeting
watch(() => store.racesByMeeting, (newRacesByMeeting) => {
  const meetings = Object.keys(newRacesByMeeting)
  if (meetings.length > 0 && expandedMeetings.value.size === 0) {
    expandedMeetings.value.add(meetings[0])
  }
}, { immediate: true, deep: true })

// Focus the retry button when error state changes
watch(() => store.loadState, (newState) => {
  if (newState === 'error' && retryButton.value) {
    setTimeout(() => {
      retryButton.value?.focus()
    }, 100)
  }
})
</script>