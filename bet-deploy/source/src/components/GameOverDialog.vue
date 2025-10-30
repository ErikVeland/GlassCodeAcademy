<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-black bg-opacity-80 transition-opacity"
      aria-hidden="true"
    ></div>
    
    <!-- Dialog panel -->
    <div 
      class="relative bg-surface-raised rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all"
      :class="{
        'scale-95 opacity-0': isAnimating,
        'scale-100 opacity-100': !isAnimating
      }"
    >
      <!-- Header -->
      <div class="bg-danger p-6 text-center">
        <div class="flex justify-center mb-4">
          <div class="w-16 h-16 rounded-full bg-text-inverse flex items-center justify-center">
            <span class="text-2xl">😢</span>
          </div>
        </div>
        <h2 class="text-2xl font-bold text-text-inverse">Game Over</h2>
      </div>
      
      <!-- Body -->
      <div class="p-6">
        <div class="text-center mb-6">
          <p class="text-text-base mb-4">
            You've run out of credits. Better luck next time!
          </p>
          <div class="bg-surface-sunken rounded-lg p-4 inline-block">
            <div class="text-text-muted text-sm">Final Balance</div>
            <div class="text-3xl font-bold text-danger">$0.00</div>
          </div>
        </div>
        
        <!-- Australian Gambling Warning -->
        <div class="bg-warning bg-opacity-20 border border-warning rounded-lg p-4 mb-6">
          <div class="flex items-start">
            <div class="flex-shrink-0 mt-1">
              <svg class="h-5 w-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-warning">Gambling Think Again</h3>
              <div class="mt-2 text-sm text-warning">
                <p class="mb-2">
                  "Gambling can be addictive. Play responsibly. Know your limit."
                </p>
                <p>
                  Gambling support: 1800 858 858 | <a href="https://www.gamblinghelponline.org.au" target="_blank" class="underline">gamblinghelponline.org.au</a>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-3">
          <button
            @click="restartGame"
            class="flex-1 px-4 py-3 bg-gradient-to-r from-brand-primary to-orange-600 text-text-inverse rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand-primary font-medium"
          >
            Restart with $100
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBetsStore } from '../stores/bets'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'restart'): void
}>()

const isAnimating = ref(true)
const betsStore = useBetsStore()

const restartGame = () => {
  betsStore.reset()
  betsStore.acceptWelcomeCredits()
  emit('restart')
}

onMounted(() => {
  // Trigger entrance animation
  setTimeout(() => {
    isAnimating.value = false
  }, 50)
})
</script>

<style scoped>
/* Add entrance animation */
.scale-95 {
  transform: scale(0.95);
}

.scale-100 {
  transform: scale(1);
}

.opacity-0 {
  opacity: 0;
}

.opacity-100 {
  opacity: 1;
}

.transition-all {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>