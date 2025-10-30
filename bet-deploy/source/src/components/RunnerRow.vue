<template>
  <div class="py-2 border-b border-surface last:border-b-0" :class="{ 'opacity-50 pointer-events-none': isExpired }">
    <div class="flex items-start">
      <!-- Silk color icon as circle with number inside -->
      <div class="w-6 h-6 rounded-full mr-3 mt-1 flex-shrink-0 flex items-center justify-center text-xs font-bold" :class="runner.silkColor">
        <span class="text-text-inverse">{{ runner.number }}</span>
      </div>
      
      <!-- Runner info and odds -->
      <div class="flex-grow min-w-0">
        <!-- Runner name full width -->
        <div class="font-medium text-text-base truncate">
          {{ runner.name }}
        </div>
        
        <!-- Meta info and odds in a row below -->
        <div class="flex items-center mt-1">
          <!-- Meta info -->
          <div class="text-sm text-text-muted truncate flex-grow min-w-0" v-if="runner.jockey || runner.weight || runner.bestTime">
            <span v-if="runner.jockey" :title="runner.jockey">{{ formatJockeyName(runner.jockey) }}</span>
            <span v-if="runner.jockey && runner.weight"> | </span>
            <span v-if="runner.weight">{{ runner.weight }}</span>
            <span v-if="(runner.jockey || runner.weight) && runner.bestTime"> | </span>
            <!-- Expand BT to Best Time on larger screens -->
            <span v-if="runner.bestTime" :title="$t('game.bestTime')">
              <span class="hidden lg:inline">Best Time: {{ runner.bestTime }}</span>
              <span class="lg:hidden">BT: {{ runner.bestTime }}</span>
            </span>
          </div>
          
          <!-- Odds button -->
          <div class="ml-2 flex-shrink-0">
            <button 
              @click="handleOddsClick"
              class="px-2 py-1 rounded-lg font-bold shadow-card transition-all duration-200 flex items-center text-sm bg-surface-sunken hover:bg-brand-primary hover:text-text-inverse border-2 border-surface"
              :class="[oddsButtonClass, oddsAnimation]"
              :disabled="isExpired"
              :aria-label="`${$t('game.addToBetslip')} ${runner.name} ${$t('game.at')} ${runner.odds}`"
              :title="getOddsButtonTitle()"
            >
              {{ runner.odds }}
              <span v-if="runner.oddsTrend === 'up'" class="ml-1 text-success">▲</span>
              <span v-else-if="runner.oddsTrend === 'down'" class="ml-1 text-danger">▼</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBettingLogic } from '../composables/useBettingLogic'
import { useBetsStore } from '../stores/bets'

const { t } = useI18n()
const betsStore = useBetsStore()

interface Runner {
  id: string
  number: number
  name: string
  weight: string
  jockey: string
  odds: string | number
  oddsTrend: 'up' | 'down' | 'none'
  silkColor: string
  bestTime?: string
}

const props = defineProps<{
  runner: Runner
  raceId: string
  raceName: string
  raceNumber: number
  isExpired?: boolean
}>()

// Track previous odds for animation (store as numbers for accurate comparison)
const previousOddsNum = ref<number>(0)
const oddsAnimation = ref('')

// Initialize previous odds
if (props.runner.odds === 'SP') {
  previousOddsNum.value = 6.0
} else {
  previousOddsNum.value = typeof props.runner.odds === 'number' ? props.runner.odds : parseFloat(String(props.runner.odds))
}

// Watch for odds changes to trigger animations
watch(() => props.runner.odds, (newOdds: string | number, oldOdds: string | number) => {
  // Odds changed for runner from oldOdds to newOdds
  
  // Convert to numbers for comparison
  let newNum: number, oldNum: number
  
  // Convert to numbers for comparison
  if (newOdds === 'SP') newNum = 6.0
  else newNum = typeof newOdds === 'number' ? newOdds : parseFloat(String(newOdds))
  
  oldNum = previousOddsNum.value
  
  // Comparing odds for runner newNum: newNum oldNum: oldNum
  
  // Trigger appropriate animation if there's a meaningful change
  if (!isNaN(newNum) && !isNaN(oldNum) && newNum !== oldNum) {
    // Check if the change is significant enough to warrant an animation
    const changePercent = Math.abs((newNum - oldNum) / oldNum) * 100
    // Odds change percentage for runner: changePercent %
    
    // Only trigger animation if change is at least 0.1% or 0.01 absolute difference
    if (changePercent >= 0.1 || Math.abs(newNum - oldNum) >= 0.01) {
      if (newNum < oldNum) {
        // Triggering odds change down animation for runner
        oddsAnimation.value = 'animate-odds-change-down'
      } else if (newNum > oldNum) {
        // Triggering odds change up animation for runner
        oddsAnimation.value = 'animate-odds-change-up'
      }
      
      // Log when animation is applied
      if (oddsAnimation.value) {
        // Applied animation class to runner
      }
      
      // Reset animation after it completes
      setTimeout(() => {
        // Resetting animation for runner
        oddsAnimation.value = ''
      }, 700)
    }
  }
  
  // Update previous odds
  previousOddsNum.value = newNum
})

const formatJockeyName = (jockeyName: string) => {
  if (!jockeyName) return ''
  
  // Check if the name already has the prefix (J: or D:)
  if (jockeyName.startsWith('J:') || jockeyName.startsWith('D:')) {
    // Split the name into prefix and the rest
    const [prefix, ...nameParts] = jockeyName.split(' ')
    
    if (nameParts.length === 0) {
      return prefix
    }
    
    if (nameParts.length === 1) {
      return `${prefix} ${nameParts[0]}`
    }
    
    // Return prefix with first initial and last name
    return `${prefix} ${nameParts[0][0]}. ${nameParts[nameParts.length - 1]}`
  }
  
  // Handle names without prefix (fallback)
  const parts = jockeyName.trim().split(' ')
  
  if (parts.length === 1) {
    return parts[0]
  }
  
  // Return first initial and last name
  return `${parts[0][0]}. ${parts[parts.length - 1]}`
}

const getOddsButtonTitle = () => {
  // Check race status
  const raceElement = document.querySelector(`[data-race-id="${props.raceId}"]`);
  if (raceElement) {
    const raceStatus = raceElement.getAttribute('data-race-status');
    if (raceStatus === 'live' || raceStatus === 'starting_soon' || raceStatus === 'finished') {
      return `Cannot place bets on ${raceStatus} races`;
    }
  }
  
  if (props.isExpired) {
    return 'Cannot place bets on expired races';
  }
  
  if (!betsStore.showGame) {
    return 'Enable game mode to place bets';
  }
  
  return `${t('game.addToBetslip')} ${props.runner.name} ${t('game.at')} ${props.runner.odds}`;
}

const oddsButtonClass = computed(() => {
  const baseClasses = 'bg-surface text-text-base hover:bg-brand-primary hover:text-text-inverse cursor-pointer'
  
  // Check race status - only allow betting on countdown races (upcoming)
  const raceElement = document.querySelector(`[data-race-id="${props.raceId}"]`);
  let isRaceActive = false;
  if (raceElement) {
    const raceStatus = raceElement.getAttribute('data-race-status');
    // Allow betting only on countdown races (upcoming)
    isRaceActive = raceStatus === 'countdown';
  }
  
  // Disable betting if race is expired OR not in countdown status
  if (props.isExpired || !isRaceActive) {
    return `${baseClasses} opacity-50 cursor-not-allowed`
  }
  
  if (props.runner.oddsTrend === 'up') {
    return `${baseClasses} bg-success bg-opacity-20`
  } else if (props.runner.oddsTrend === 'down') {
    return `${baseClasses} bg-danger bg-opacity-20`
  }
  
  return baseClasses
})

const handleOddsClick = () => {
  // Check race status - only allow betting on countdown races (upcoming)
  const raceElement = document.querySelector(`[data-race-id="${props.raceId}"]`);
  let isRaceCountdown = false;
  if (raceElement) {
    const raceStatus = raceElement.getAttribute('data-race-status');
    // Allow betting only on countdown races (upcoming)
    isRaceCountdown = raceStatus === 'countdown';
  }
  
  // MUST prevent betting if race is not in countdown status
  if (!isRaceCountdown) {
    // BLOCKED: Cannot place bet on non-countdown race
    return;
  }
  
  // Check if race is expired - MUST prevent betting
  if (props.isExpired) {
    // BLOCKED: Cannot place bet on expired race
    return;
  }
  
  // Check if game mode is enabled
  if (!betsStore.showGame) {
    // Emit event to show game mode dialog
    const event = new CustomEvent('show-game-mode-dialog')
    window.dispatchEvent(event)
    return
  }
  
  // Convert odds to number or 'SP'
  let odds: number | 'SP' = 'SP'
  if (props.runner.odds !== 'SP') {
    const oddsNum = typeof props.runner.odds === 'number' ? props.runner.odds : parseFloat(props.runner.odds)
    if (!isNaN(oddsNum)) {
      odds = oddsNum
    }
  }
  
  // ALLOWED: Adding runner to betslip
  
  // Emit Vue event to parent chain; parent components will open the betslip
  emit('add-to-betslip', {
    ...props.runner,
    raceName: props.raceName,
    raceNumber: props.raceNumber
  })
}
</script>
const emit = defineEmits<{
  (e: 'add-to-betslip', runner: any): void
}>()