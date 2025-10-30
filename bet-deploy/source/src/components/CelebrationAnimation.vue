<template>
  <div v-if="showConfetti || showWinCelebration" class="fixed inset-0 z-50 pointer-events-none">
    <!-- Confetti animation -->
    <div v-if="showConfetti" class="absolute inset-0 overflow-hidden">
      <div 
        v-for="i in 200" 
        :key="i"
        class="absolute w-2 h-2 rounded-full"
        :style="confettiStyles[i - 1]"
      ></div>
    </div>
    
    <!-- Win celebration -->
    <div 
      v-if="showWinCelebration"
      class="absolute inset-0 flex items-center justify-center"
    >
      <div class="bg-surface-raised rounded-xl p-8 shadow-xl border border-brand-primary animate-pulse transform transition-all duration-300 hover:scale-105">
        <div class="text-center">
          <div class="text-5xl mb-4">🏆</div>
          <h2 class="text-2xl font-bold text-text-base mb-2">Congratulations!</h2>
          <p class="text-text-base mb-4">You won <span class="font-bold text-success">${{ (winAmount / 100).toFixed(2) }}</span></p>
          <div class="text-3xl">🎉</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useAnimationEffects } from '../composables/useAnimationEffects'

// Define CustomEvent type for TypeScript
interface CustomEventDetail {
  amount?: number;
  winAmount?: number;
}

const { showConfetti, showWinCelebration, winAmount, triggerWinCelebration } = useAnimationEffects()

// Generate confetti styles
const confettiStyles = ref<any[]>([])

onMounted(() => {
  // Generate random confetti pieces
  const pieces = []
  for (let i = 0; i < 200; i++) {
    // Create different shapes
    const isCircle = Math.random() > 0.5
    const size = Math.random() * 12 + 4
    
    pieces.push({
      left: `${Math.random() * 100}%`,
      top: `-10%`,
      backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: isCircle ? '50%' : '0',
      animation: `confetti-fall ${Math.random() * 4 + 3}s linear forwards, confetti-spin ${Math.random() * 2 + 1}s linear infinite`,
      animationDelay: `${Math.random() * 3}s`,
      opacity: Math.random() * 0.5 + 0.5
    })
  }
  confettiStyles.value = pieces
  
  // Listen for win celebration trigger
  const handleWinCelebration = (event: Event) => {
    const customEvent = event as CustomEvent<CustomEventDetail>;
    if (customEvent.detail && customEvent.detail.amount) {
      triggerWinCelebration(customEvent.detail.amount);
    }
  };
  window.addEventListener('trigger-win-celebration', handleWinCelebration as EventListener);
  
  // Clean up event listener
  onUnmounted(() => {
    window.removeEventListener('trigger-win-celebration', handleWinCelebration as EventListener);
  });
})
</script>

<style scoped>
@keyframes confetti-fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

@keyframes confetti-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.animate-pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
</style>