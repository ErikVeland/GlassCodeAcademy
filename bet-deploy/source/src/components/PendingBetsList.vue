<template>
  <div class="space-y-4">
    <div 
      v-for="bet in bets" 
      :key="bet.betId"
      class="bg-surface rounded-xl p-4 shadow-card"
      role="region"
      :aria-labelledby="`bet-title-${bet.betId}`"
    >
      <!-- Selection identity -->
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center mb-1">
            <!-- Category icon or silks -->
            <div class="w-4 h-4 rounded-sm mr-2 bg-brand-primary"></div>
            <h4 
  :id="`bet-title-${bet.betId}`"
  class="font-bold text-text-base truncate"
>
  {{ getRunnerName(bet) }}
</h4>
          </div>
          <p class="text-text-muted text-sm truncate">{{ getMeetingName(bet) }} R{{ getRaceNumber(bet) }}</p>
        </div>
        <div class="flex items-center space-x-2 ml-2">
          <!-- Status badge -->
          <span class="px-2 py-1 bg-warning bg-opacity-20 text-warning text-xs font-medium rounded-full">
            Pending
          </span>
        </div>
      </div>
      
      <!-- Bet details -->
      <div class="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p class="text-text-muted text-xs">Stake</p>
          <p class="text-text-base font-medium">${{ (getStake(bet) / 100).toFixed(2) }}</p>
        </div>
        <div>
          <p class="text-text-muted text-xs">Odds</p>
          <p class="text-text-base font-medium">{{ formatOdds(getOdds(bet)) }}</p>
        </div>
      </div>
      
      <!-- Action buttons -->
      <div class="flex space-x-2 mt-2">
        <button
          @click="cashoutBet(bet.betId)"
          class="flex-1 py-2 text-center text-text-base text-sm bg-warning bg-opacity-20 hover:bg-opacity-30 rounded-lg focus:outline-none"
        >
          Cash Out
        </button>
        <button
          @click="cancelBet(bet.betId)"
          class="flex-1 py-2 text-center text-text-muted text-sm hover:text-danger hover:underline focus:outline-none"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBetsStore } from '../stores/bets'
import { type Bet, type SingleBet, type MultiBet, type ExoticBet } from '../game/bettingSimulator'

const props = defineProps<{
  bets: Bet[]
}>()

const betsStore = useBetsStore()

// Methods to extract data from different bet types
const getRunnerName = (bet: Bet) => {
  if (bet.type === 'WIN' || bet.type === 'PLACE' || bet.type === 'EACH_WAY') {
    const singleBet = bet as SingleBet;
    return singleBet.leg?.selectionName || 'Unknown Runner';
  } else if (bet.type === 'MULTI' && (bet as MultiBet).legs.length > 0) {
    const multiBet = bet as MultiBet;
    return multiBet.legs[0]?.selectionName || 'Unknown Runner';
  } else if (['QUINELLA', 'TRIFECTA', 'FIRST_FOUR'].includes(bet.type) && (bet as ExoticBet).legs.length > 0) {
    const exoticBet = bet as ExoticBet;
    return exoticBet.legs[0]?.selectionName || 'Unknown Runner';
  }
  return 'Unknown Runner';
}

const getMeetingName = (bet: Bet) => {
  if (bet.type === 'WIN' || bet.type === 'PLACE' || bet.type === 'EACH_WAY') {
    const singleBet = bet as SingleBet;
    // Use the actual meeting name if available, otherwise fall back to race ID
    return singleBet.leg?.raceId ? `Race ${singleBet.leg.raceId.substring(0, 8)}` : 'Unknown Meeting';
  } else if (bet.type === 'MULTI' && (bet as MultiBet).legs.length > 0) {
    const multiBet = bet as MultiBet;
    return multiBet.legs[0]?.raceId ? `Race ${multiBet.legs[0].raceId.substring(0, 8)}` : 'Unknown Meeting';
  } else if (['QUINELLA', 'TRIFECTA', 'FIRST_FOUR'].includes(bet.type) && (bet as ExoticBet).legs.length > 0) {
    const exoticBet = bet as ExoticBet;
    return exoticBet.legs[0]?.raceId ? `Race ${exoticBet.legs[0].raceId.substring(0, 8)}` : 'Unknown Meeting';
  }
  return 'Unknown Meeting';
}

const getRaceNumber = (bet: Bet) => {
  // For now, default to 1 as we don't have race number information in the bet object
  return 1;
}

const getStake = (bet: Bet) => {
  return bet.stake || 0;
}

const getOdds = (bet: Bet) => {
  if (bet.type === 'WIN' || bet.type === 'PLACE' || bet.type === 'EACH_WAY') {
    const singleBet = bet as SingleBet;
    return singleBet.leg?.oddsDecimalAtPlacement || 'SP';
  } else if (bet.type === 'MULTI' && (bet as MultiBet).legs.length > 0) {
    const multiBet = bet as MultiBet;
    return multiBet.legs[0]?.oddsDecimalAtPlacement || 'SP';
  } else if (['QUINELLA', 'TRIFECTA', 'FIRST_FOUR'].includes(bet.type) && (bet as ExoticBet).legs.length > 0) {
    const exoticBet = bet as ExoticBet;
    return exoticBet.legs[0]?.oddsDecimalAtPlacement || 'SP';
  }
  return 'SP';
}

const formatOdds = (odds: number | 'SP') => {
  return odds === 'SP' ? 'SP' : odds.toFixed(2)
}

const cancelBet = (betId: string) => {
  betsStore.cancelBet(betId)
}

const cashoutBet = (betId: string) => {
  betsStore.cashoutBet(betId)
}

</script>