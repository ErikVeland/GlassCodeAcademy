<template>
  <div 
    class="bg-surface rounded-xl p-4 shadow-card"
    role="region"
    :aria-labelledby="`selection-title-${selection.id}`"
    ref="cardElement"
  >
    <!-- Selection identity -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex-1 min-w-0">
        <div class="flex items-center mb-1">
          <!-- Category icon or silks -->
          <div class="w-4 h-4 rounded-sm mr-2 bg-brand-primary"></div>
          <h4 
            :id="`selection-title-${selection.id}`"
            class="font-bold text-text-base truncate"
          >
            {{ selection.runnerNumber }}. {{ selection.runnerName }}
          </h4>
        </div>
        <p class="text-text-muted text-sm truncate">{{ selection.raceName }} R{{ selection.raceNumber }}</p>
      </div>
      <div class="flex items-center space-x-2 ml-2">
        <!-- Odds badge -->
        <span 
          class="px-3 py-1 bg-surface-sunken text-text-base text-sm font-medium rounded-full"
          ref="oddsElement"
        >
          {{ formatOdds(selection.odds) }}
        </span>
        <button 
          @click="remove"
          class="p-1 text-text-muted hover:text-danger focus:outline-none"
          aria-label="Remove selection"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Market toggle -->
    <div class="mb-3">
      <div class="flex rounded-lg bg-surface-sunken p-1">
        <button
          @click="updateMarket('win')"
          class="flex-1 py-1 text-xs font-medium rounded-md transition-colors"
          :class="selection.market === 'win' 
            ? 'bg-brand-primary text-text-inverse' 
            : 'text-text-muted hover:bg-surface-raised'"
          aria-label="Win market - Bet to finish 1st"
        >
          Win
        </button>
        <button
          @click="updateMarket('place')"
          class="flex-1 py-1 text-xs font-medium rounded-md transition-colors"
          :class="selection.market === 'place' 
            ? 'bg-brand-primary text-text-inverse' 
            : 'text-text-muted hover:bg-surface-raised'"
          aria-label="Place market - Bet to finish in top positions"
        >
          Place
        </button>
        <button
          @click="updateMarket('each-way')"
          class="flex-1 py-1 text-xs font-medium rounded-md transition-colors"
          :class="selection.market === 'each-way' 
            ? 'bg-brand-primary text-text-inverse' 
            : 'text-text-muted hover:bg-surface-raised'"
          aria-label="Each way market - Half stake Win + Half stake Place"
        >
          Each Way
        </button>
      </div>
    </div>
    
    <!-- Stake input -->
    <div class="mb-2">
      <label class="block text-text-muted text-xs mb-1">Stake</label>
      <div class="relative">
        <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted">$</span>
        <input
          v-model.number="stakeInput"
          type="number"
          step="0.1"
          min="0"
          class="w-full pl-8 pr-4 py-2 bg-surface-sunken text-text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
          :class="{ 'border border-danger': hasError }"
          placeholder="0.00"
          aria-label="Enter stake amount"
        >
      </div>
      <div v-if="hasError" class="text-danger text-xs mt-1">
        {{ errorMessage }}
      </div>
    </div>
    
    <!-- Estimated return -->
    <div class="flex justify-between items-center">
      <span class="text-text-muted text-sm">Est. Return:</span>
      <span class="font-medium text-success">${{ (estimatedReturn / 100).toFixed(2) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { type BetSelection } from '../stores/bets'
import { useVirtualCurrency } from '../composables/useVirtualCurrency'
import { useBettingLogic } from '../composables/useBettingLogic'
import { useAnimationEffects } from '../composables/useAnimationEffects'
import { useBettingFeedback } from '../composables/useBettingFeedback'

const props = defineProps<{
  selection: BetSelection
}>()

const emit = defineEmits<{
  (e: 'update-market', selectionId: string, market: 'win' | 'place' | 'each-way'): void
  (e: 'update-stake', selectionId: string, stake: number): void
  (e: 'remove', selectionId: string): void
}>()

const { availableBalance } = useVirtualCurrency()
const { calculateEstimatedReturn } = useBettingLogic()
const { flashElement } = useAnimationEffects()
const { flashElement: flashElementFeedback } = useBettingFeedback()

// Refs
const cardElement = ref<HTMLElement | null>(null)
const oddsElement = ref<HTMLElement | null>(null)
const previousOdds = ref(props.selection.odds)

// State
const stakeInput = ref(props.selection.stake / 100) // Convert from cents to dollars

// Watch for changes to stakeInput and emit update-stake event immediately
watch(stakeInput, (newStake) => {
  // Convert to cents and emit
  const stakeInCents = Math.round(newStake * 100)
  emit('update-stake', props.selection.id, stakeInCents)
})

// Computed
const hasError = computed(() => {
  return stakeInput.value > 0 && (stakeInput.value * 100 > availableBalance.value || stakeInput.value < 0.1)
})

const errorMessage = computed(() => {
  if (stakeInput.value * 100 > availableBalance.value) {
    return 'Insufficient credits'
  }
  if (stakeInput.value > 0 && stakeInput.value < 0.1) {
    return 'Minimum stake is $0.10'
  }
  return ''
})

// Calculate estimated return based on current stake input
const estimatedReturn = computed(() => {
  const stakeInCents = Math.round(stakeInput.value * 100)
  const result = calculateEstimatedReturn(stakeInCents, props.selection.odds, props.selection.market)
  return isNaN(result) ? 0 : result
})

// Methods
const formatOdds = (odds: number | 'SP') => {
  if (odds === 'SP') return 'SP'
  const numericOdds = typeof odds === 'number' ? odds : parseFloat(String(odds))
  return isNaN(numericOdds) ? 'SP' : numericOdds.toFixed(2)
}

const updateMarket = (market: 'win' | 'place' | 'each-way') => {
  emit('update-market', props.selection.id, market)
}

// Remove the updateStake method since we're now updating in real-time
const remove = () => {
  emit('remove', props.selection.id)
}

// Watch for odds changes to flash the element
watch(() => props.selection.odds, (newOdds, oldOdds) => {
  if (oddsElement.value) {
    // Determine flash color based on odds change
    let flashColor: 'green' | 'red' = 'green'
    
    // Handle SP odds
    const newNumericOdds = newOdds === 'SP' ? 6.0 : newOdds
    const oldNumericOdds = oldOdds === 'SP' ? 6.0 : oldOdds
    
    // Flash red if odds decreased, green if increased
    if (newNumericOdds < oldNumericOdds) {
      flashColor = 'red'
    } else if (newNumericOdds > oldNumericOdds) {
      flashColor = 'green'
    }
    
    // Flash the element
    flashElement(oddsElement.value, flashColor)
  }
  
  // Update previous odds
  previousOdds.value = newOdds
})

// Watch for external changes to selection stake
watch(() => props.selection.stake, (newStake) => {
  stakeInput.value = newStake / 100
})

// Lifecycle
onMounted(() => {
  // Initialize previous odds
  previousOdds.value = props.selection.odds
})
</script>

<style scoped>
.flash {
  animation: flash-animation 1s;
}

.flash-green {
  background-color: rgba(76, 175, 80, 0.3) !important;
}

.flash-red {
  background-color: rgba(244, 67, 54, 0.3) !important;
}

@keyframes flash-animation {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}
</style>