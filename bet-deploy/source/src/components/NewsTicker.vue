<template>
  <div v-if="showTicker && isSimulationMode" class="fixed top-16 left-0 right-0 bg-brand-primary text-text-inverse py-2 z-50">
    <div class="container mx-auto px-4 overflow-hidden">
      <div class="animate-marquee whitespace-nowrap">
        {{ currentMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useBetsStore } from '../stores/bets'

// State
const showTicker = ref(false)
const currentMessage = ref('')
const messages = ref<string[]>([])
const betsStore = useBetsStore()

// Only show ticker in simulation mode
const isSimulationMode = computed(() => {
  return betsStore.showGame && betsStore.useSimulatedData
})

// Add a message to the ticker
const addMessage = (message: string) => {
  messages.value.push(message)
  if (!showTicker.value) {
    showTicker.value = true
  }
  currentMessage.value = message
  
  // Log to console for debugging in development only
  // Only log critical errors in production
}

// Clear all messages and hide ticker
const clearMessages = () => {
  messages.value = []
  showTicker.value = false
  currentMessage.value = ''
}

// Handle race update events
const handleRaceUpdate = (event: CustomEvent) => {
  const { raceId, message, leaderboard, userBets } = event.detail
  
  // Create enhanced message with leaderboard and user bet info
  let enhancedMessage = message
  
  // Add leaderboard information if available
  if (leaderboard && leaderboard.length > 0) {
    const leaders = leaderboard.slice(0, 3).map((runner: any, index: number) => 
      `${index + 1}. ${runner.name}`
    ).join(', ')
    enhancedMessage += ` | Leading: ${leaders}`
  }
  
  // Add user bet information if available
  if (userBets && userBets.length > 0) {
    const userRunners = userBets.map((bet: any) => bet.runnerName).join(', ')
    enhancedMessage += ` | Your bets: ${userRunners}`
  }
  
  addMessage(enhancedMessage)
  
  // Auto-clear after 5 seconds
  setTimeout(() => {
    clearMessages()
  }, 5000)
}

// Handle race finish events
const handleRaceFinish = (event: CustomEvent) => {
  const { raceId, message, winner, userBets } = event.detail
  
  // Create enhanced finish message
  let enhancedMessage = message
  
  // Add user bet result information
  if (userBets && userBets.length > 0) {
    const winningBets = userBets.filter((bet: any) => bet.runnerId === winner.id)
    if (winningBets.length > 0) {
      enhancedMessage += ` | YOU WON! ${winningBets.length} of your bets were correct!`
    } else {
      enhancedMessage += ` | None of your bets won this race.`
    }
  }
  
  addMessage(enhancedMessage)
  
  // Keep winner message visible longer
  setTimeout(() => {
    clearMessages()
  }, 10000)
}

// Handle race start events
const handleRaceStart = (event: CustomEvent) => {
  const { raceName, raceNumber, userBets } = event.detail
  
  let message = `LIVE: ${raceName} R${raceNumber} has started!`
  
  // Add user bet information
  if (userBets && userBets.length > 0) {
    const betRunners = userBets.map((bet: any) => bet.runnerName).join(', ')
    message += ` | You have bets on: ${betRunners}`
  }
  
  addMessage(message)
  
  // Auto-clear after 5 seconds
  setTimeout(() => {
    clearMessages()
  }, 5000)
}

// Lifecycle
onMounted(() => {
  // Listen for race events
  window.addEventListener('race-update', handleRaceUpdate as EventListener)
  window.addEventListener('race-finish', handleRaceFinish as EventListener)
  window.addEventListener('race-start', handleRaceStart as EventListener)
})

onUnmounted(() => {
  // Clean up event listeners
  window.removeEventListener('race-update', handleRaceUpdate as EventListener)
  window.removeEventListener('race-finish', handleRaceFinish as EventListener)
  window.removeEventListener('race-start', handleRaceStart as EventListener)
})
</script>

<style scoped>
@keyframes marquee {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

.animate-marquee {
  display: inline-block;
  animation: marquee 15s linear infinite;
}
</style>
```
