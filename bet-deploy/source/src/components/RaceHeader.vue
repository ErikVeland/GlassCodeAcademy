<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useCountdown } from '../composables/useCountdown'
import { CATEGORY_IDS } from '../stores/races'

const props = defineProps<{
  meetingName: string
  raceNumber: number
  categoryId: string
  startTime: number
  isExpired?: boolean
  raceId: string
}>()

const categoryIcon = computed(() => {
  switch (props.categoryId) {
    case CATEGORY_IDS.HORSE:
      return 'horse'
    case CATEGORY_IDS.GREYHOUND:
      return 'greyhound'
    case CATEGORY_IDS.HARNESS:
      return 'harness'
    default:
      return 'horse'
  }
})

// Use the composable for countdown
const { formattedTime, isStartingSoon, isInProgress } = useCountdown(props.startTime)

// Flashing state for countdown
const isFlashing = ref(false)
const isFlashingRed = ref(false)
const flashInterval = ref<number | null>(null)

// Start flashing when countdown is low
watch(isStartingSoon, (startingSoon) => {
  if (startingSoon && !isFlashing.value) {
    isFlashing.value = true
    startFlashing()
  } else if (!startingSoon) {
    isFlashing.value = false
    stopFlashing()
  }
})

const startFlashing = () => {
  if (flashInterval.value) return
  
  // Alternate between red and original color every 500ms
  flashInterval.value = window.setInterval(() => {
    isFlashingRed.value = !isFlashingRed.value
  }, 500) as unknown as number
}

const stopFlashing = () => {
  if (flashInterval.value) {
    clearInterval(flashInterval.value)
    flashInterval.value = null
  }
  isFlashingRed.value = false
}

const progressPercentage = computed(() => {
  if (props.isExpired || isInProgress.value) {
    return 0
  }
  
  // Parse the formatted time to get minutes and seconds
  const timeStr = formattedTime.value
  if (!timeStr || timeStr === 'NaN:NaN' || timeStr === 'Starting soon') {
    return 0
  }
  
  // Parse MM:SS format
  const parts = timeStr.split(':')
  if (parts.length !== 2) {
    return 0
  }
  
  const minutes = parseInt(parts[0], 10)
  const seconds = parseInt(parts[1], 10)
  
  if (isNaN(minutes) || isNaN(seconds)) {
    return 0
  }
  
  // Calculate total seconds remaining
  const totalSeconds = minutes * 60 + seconds
  
  // For progress bar, we want it to count down from 60 seconds (1 minute) to 0
  // If more than 60 seconds remain, show full progress bar
  const displaySeconds = Math.min(totalSeconds, 60) // Cap at 60 seconds for display
  const percentage = (displaySeconds / 60) * 100 // Calculate percentage of 60 seconds
  
  return Math.max(0, Math.min(100, percentage))
})

// Enhanced race status computation
const raceStatus = computed<'finished' | 'live' | 'starting_soon' | 'countdown'>(() => {
  if (props.isExpired) return 'finished'
  if (isInProgress.value) return 'live'
  if (isStartingSoon.value) return 'starting_soon'
  return 'countdown'
})

// Get letter style based on progress
const getLetterStyle = (index: number) => {
  // If flashing red, all letters should be white
  if (isFlashingRed.value) {
    return { opacity: 1, color: 'white', transition: 'color 0.3s ease' }
  }
  
  // Calculate the position of this letter in the progress bar
  const totalWidth = 64 // Approximate width of the progress bar in pixels (w-16 = 4rem = 64px)
  const letterPosition = (index / countdownDisplay.value.length) * totalWidth
  const progressWidth = (progressPercentage.value / 100) * totalWidth
  
  // If the progress bar has passed this letter, make it black
  // Otherwise, keep the text white (inverted logic as requested)
  if (letterPosition < progressWidth) {
    return { opacity: 1, color: 'black', transition: 'color 0.3s ease' }
  }
  
  // Otherwise, keep the text white
  return { opacity: 1, color: 'white', transition: 'color 0.3s ease' }
}

const countdownDisplay = computed(() => {
  if (props.isExpired) {
    return 'Over'
  }
  
  if (isInProgress.value) {
    return 'LIVE'
  }
  
  // Handle case where formattedTime might be undefined or invalid
  if (!formattedTime.value || formattedTime.value === 'NaN:NaN') {
    return '00:00'
  }
  
  return formattedTime.value
})

// Get class for countdown element
const getCountdownClass = () => {
  return {
    'bg-danger': isFlashingRed.value,
    'bg-warning': raceStatus.value === 'starting_soon'
  }
}

// Clean up intervals
onUnmounted(() => {
  if (flashInterval.value) {
    clearInterval(flashInterval.value)
    flashInterval.value = null
  }
})
</script>

<template>
  <div class="bg-surface-sunken px-3 py-2 flex items-center justify-between relative rounded-t-xl2 overflow-hidden">
    <!-- Background category icon (full card) -->
    <div class="absolute bottom-0 right-0 opacity-10 w-full h-full z-0 overflow-hidden pointer-events-none select-none">
      <span v-if="categoryIcon === 'horse'" class="text-[120px] block absolute bottom-[-25%] right-[-15%]">🏇</span>
      <span v-else-if="categoryIcon === 'greyhound'" class="text-[120px] block absolute bottom-[-25%] right-[-15%]">🐕</span>
      <span v-else-if="categoryIcon === 'harness'" class="text-[120px] block absolute bottom-[-25%] right-[-15%]">🛞</span>
    </div>
    
    <!-- Race number cap (smaller circular) -->
    <div class="absolute top-1/2 left-2 transform -translate-y-1/2 bg-brand-primary text-text-inverse w-6 h-6 flex items-center justify-center font-bold text-sm z-10 rounded-full">
      {{ raceNumber }}
    </div>
    
    <!-- Meeting name with ellipsis - properly spaced -->
    <div 
      class="relative z-10 font-bold uppercase text-text-base flex-grow text-left min-w-0 ml-8 mr-2" 
      :class="{ 
        'opacity-50': isExpired,
        'text-success': raceStatus === 'live',
        'text-warning': raceStatus === 'starting_soon',
        'text-text-muted': raceStatus === 'finished'
      }"
      :title="meetingName"
    >
      <div class="truncate">{{ meetingName }}</div>
    </div>
    
    <div class="relative z-10 flex items-center">
      <div 
        v-if="raceStatus === 'live'" 
        class="px-3 py-1 rounded-full text-xs font-bold bg-danger text-text-inverse flex items-center border-2 border-danger shadow-lg transform scale-105"
        style="margin-right: 0; transform: translateX(3px);"
      >
        <span class="mr-1 animate-ping">●</span>
        <span class="hidden sm:inline font-extrabold">LIVE</span>
        <span class="sm:hidden">●</span>
      </div>
      <div 
        v-else-if="raceStatus === 'finished'"
        class="px-3 py-1 rounded-full text-xs font-bold text-text-muted bg-surface-raised border-2 border-text-muted opacity-75"
        style="margin-right: 0; transform: translateX(3px);"
      >
        <span class="font-medium">OVER</span>
      </div>
      <div 
        v-else-if="raceStatus === 'starting_soon'"
        class="px-3 py-1 rounded-full text-xs font-bold bg-warning text-text-inverse flex items-center border-2 border-warning shadow-md"
        style="margin-right: 0; transform: translateX(3px);"
      >
        <span class="mr-1 animate-bounce">●</span>
        <span class="hidden sm:inline font-bold">SOON</span>
        <span class="sm:hidden">●</span>
      </div>
      <div 
        v-else
        class="relative h-6 border-2 border-brand-primary flex items-center rounded-full overflow-hidden"
        :class="{
          'bg-danger': isFlashingRed,
          'bg-warning': raceStatus === 'starting_soon'
        }"
        style="width: 64px; margin-right: 0; transform: translateX(3px);"
      >
        <!-- Progress bar background -->
        <div class="absolute inset-0 bg-surface-raised"></div>
        
        <!-- Progress fill (straight edges) -->
        <div 
          class="absolute inset-0 bg-brand-primary transition-all duration-1000 ease-linear"
          :style="{ width: progressPercentage + '%' }"
        ></div>
        
        <!-- Countdown text with letter-by-letter fade -->
        <div class="absolute inset-0 flex items-center justify-center text-xs font-bold whitespace-nowrap">
          <span 
            v-for="(char, index) in countdownDisplay" 
            :key="index"
            class="transition-opacity duration-300"
            :style="getLetterStyle(index)"
          >
            {{ char }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>