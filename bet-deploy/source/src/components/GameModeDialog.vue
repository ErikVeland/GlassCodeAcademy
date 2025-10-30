<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-black bg-opacity-70 transition-opacity"
      @click="close"
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
      <!-- Header with decorative elements -->
      <div class="bg-gradient-to-r from-brand-primary to-brand-accent p-6 text-center relative">
        <div class="absolute top-2 right-2 w-16 h-16 rounded-full bg-white bg-opacity-20"></div>
        <div class="absolute bottom-2 left-2 w-12 h-12 rounded-full bg-white bg-opacity-20"></div>
        <div class="absolute top-6 left-6 w-8 h-8 rounded-full bg-white bg-opacity-20"></div>
        
        <div class="relative z-10">
          <div class="flex justify-center mb-4">
            <div class="w-16 h-16 rounded-full bg-text-inverse flex items-center justify-center">
              <span class="text-2xl">🎮</span>
            </div>
          </div>
          <h2 class="text-2xl font-bold text-text-inverse">Ready to Play?</h2>
        </div>
      </div>
      
      <!-- Body -->
      <div class="p-6">
        <div class="text-center mb-6">
          <p class="text-text-base mb-4">
            Turn on Game Mode to start betting on races with virtual credits!
          </p>
          <div class="bg-surface-sunken rounded-lg p-4 inline-block">
            <div class="text-text-muted text-sm">Starting Balance</div>
            <div class="text-3xl font-bold text-brand-primary">$100.00</div>
          </div>
        </div>
        
        <!-- Warning -->
        <div class="bg-warning bg-opacity-20 border border-warning rounded-lg p-4 mb-6">
          <div class="flex items-start">
            <div class="flex-shrink-0 mt-1">
              <svg class="h-5 w-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-warning">Gambling Warning</h3>
              <div class="mt-2 text-sm text-warning">
                <p>
                  This is a simulation only. Gambling can be addictive. Play responsibly.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-3">
          <button
            @click="close"
            class="flex-1 px-4 py-3 bg-surface text-text-base rounded-lg hover:bg-surface-sunken transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            Maybe Later
          </button>
          <button
            @click="enableGameMode"
            class="flex-1 px-4 py-3 bg-gradient-to-r from-brand-primary to-orange-600 text-text-inverse rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand-primary font-medium"
          >
            Let's Play!
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
  (e: 'close'): void
  (e: 'confirm'): void
}>()

const isAnimating = ref(true)
const betsStore = useBetsStore()

const close = () => {
  emit('close')
}

const enableGameMode = () => {
  betsStore.setShowGame(true)
  betsStore.setUseSimulatedData(true)
  emit('confirm')
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