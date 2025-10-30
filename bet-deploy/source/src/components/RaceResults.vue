<template>
  <div v-if="betsStore.showGame && raceResult" class="mt-6 bg-surface-sunken rounded-lg p-4 animate-race-finish">
    <h3 class="text-lg font-semibold text-text-base mb-3">Race Results</h3>
    
    <div class="mb-4">
      <div class="flex items-center mb-2" v-for="(runnerId, index) in raceResult.placings" :key="runnerId">
        <div class="w-8 h-8 flex items-center justify-center rounded-full bg-brand-primary text-text-inverse mr-3">
          {{ index + 1 }}
        </div>
        <div class="flex-1">
          <div class="text-text-base">{{ getRunnerName(runnerId) }}</div>
          <div class="text-text-muted text-sm">{{ getRunnerNumber(runnerId) }}</div>
        </div>
        <div v-if="isWinner(runnerId)" class="text-success font-medium">Winner!</div>
      </div>
    </div>
    
    <div v-if="userWon" class="bg-success bg-opacity-20 rounded-lg p-3">
      <div class="text-success font-medium">Congratulations!</div>
      <div class="text-text-base">You won ${{ winnings.toFixed(2) }} on your bet!</div>
    </div>
    
    <div v-else-if="hasBets" class="bg-danger bg-opacity-20 rounded-lg p-3">
      <div class="text-danger font-medium">Better luck next time!</div>
      <div class="text-text-base">Your bet didn't win this race.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBetsStore } from '../stores/bets'

const props = defineProps<{
  raceId: string,
  runners: Array<{
    id: string,
    number: number,
    name: string
  }>,
  raceResult: {
    placings: string[]
  } | null
}>()

const betsStore = useBetsStore()

const pendingBets = computed(() => betsStore.engine.getPendingBetsForRace(props.raceId))
const hasBets = computed(() => pendingBets.value.length > 0)
const userWon = computed(() => {
  if (!props.raceResult || pendingBets.value.length === 0) return false
  
  const winnerId = props.raceResult.placings[0]
  return pendingBets.value.some(bet => {
    if (bet.leg) {
      return bet.leg.selectionRunnerId === winnerId
    } else if (bet.legs && bet.legs.length > 0) {
      return bet.legs[0].selectionRunnerId === winnerId
    }
    return false
  })
})

const winnings = computed(() => {
  if (!props.raceResult || !userWon.value) return 0
  
  const winnerId = props.raceResult.placings[0]
  const winningBet = pendingBets.value.find(bet => {
    if (bet.leg) {
      return bet.leg.selectionRunnerId === winnerId
    } else if (bet.legs && bet.legs.length > 0) {
      return bet.legs[0].selectionRunnerId === winnerId
    }
    return false
  })
  
  if (!winningBet) return 0
  
  let odds = 1
  if (winningBet.leg) {
    odds = winningBet.leg.oddsDecimalAtPlacement
  } else if (winningBet.legs && winningBet.legs.length > 0) {
    odds = winningBet.legs[0].oddsDecimalAtPlacement
  }
  
  return winningBet.stake * odds
})

const getRunnerName = (runnerId: string) => {
  const runner = props.runners.find(r => r.id === runnerId)
  return runner ? runner.name : 'Unknown Runner'
}

const getRunnerNumber = (runnerId: string) => {
  const runner = props.runners.find(r => r.id === runnerId)
  return runner ? `#${runner.number}` : ''
}

const isWinner = (runnerId: string) => {
  if (!props.raceResult) return false
  return props.raceResult.placings[0] === runnerId
}

const getRunnerIdFromBet = (bet: any) => {
  if (bet.leg) {
    return bet.leg.selectionRunnerId
  } else if (bet.legs && bet.legs.length > 0) {
    return bet.legs[0].selectionRunnerId
  }
  return ''
}
</script>