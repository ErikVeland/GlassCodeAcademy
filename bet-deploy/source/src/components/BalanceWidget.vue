<template>
  <div class="relative" @mouseenter="showTooltip = true" @mouseleave="showTooltip = false">
    <!-- Balance display as rounded pill -->
    <div class="flex items-center bg-surface-sunken rounded-full px-4 py-2 border-2 border-surface">
      <span class="text-text-muted text-sm font-medium">Credits:</span>
      <span class="font-medium text-text-base ml-2">${{ (availableBalance / 100).toFixed(2) }}</span>
    </div>
    
    <!-- Tooltip -->
    <div 
      v-if="showTooltip"
      class="absolute right-0 mt-2 w-64 bg-surface-raised rounded-lg shadow-lg z-10 border border-surface p-4"
      role="tooltip"
      aria-label="Balance details"
    >
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-text-muted">Available</span>
          <span class="text-text-base">${{ (availableBalance / 100).toFixed(2) }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-text-muted">Locked</span>
          <span class="text-text-base">${{ (lockedBalance / 100).toFixed(2) }}</span>
        </div>
        <div class="flex justify-between text-sm font-medium pt-2 border-t border-surface">
          <span class="text-text-muted">Total</span>
          <span class="text-text-base">${{ (totalBalance / 100).toFixed(2) }}</span>
        </div>
      </div>
    </div>
    
    <!-- Dropdown (click to open) -->
    <div 
      v-if="showDropdown"
      class="absolute right-0 mt-2 w-64 bg-surface-raised rounded-lg shadow-lg z-10 border border-surface"
      role="dialog"
      aria-label="Transaction history"
      aria-modal="true"
    >
      <div class="p-4 border-b border-surface">
        <h3 class="font-medium text-text-base">Holdings</h3>
      </div>
      
      <div class="p-4 space-y-3">
        <div class="flex justify-between text-sm">
          <span class="text-text-muted">Available</span>
          <span class="text-text-base">${{ (availableBalance / 100).toFixed(2) }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-text-muted">Locked</span>
          <span class="text-text-base">${{ (lockedBalance / 100).toFixed(2) }}</span>
        </div>
        <div class="flex justify-between text-sm font-medium pt-2 border-t border-surface">
          <span class="text-text-muted">Total</span>
          <span class="text-text-base">${{ (totalBalance / 100).toFixed(2) }}</span>
        </div>
      </div>
      
      <div class="border-t border-surface">
        <div class="p-4">
          <h4 class="text-sm font-medium text-text-base mb-2">Recent Transactions</h4>
          <div v-if="recentTransactions.length === 0" class="text-text-muted text-sm">
            No transactions yet
          </div>
          <div v-else class="space-y-2">
            <div 
              v-for="transaction in recentTransactions" 
              :key="transaction.id"
              class="flex justify-between text-sm"
            >
              <div>
                <div class="text-text-base">{{ transaction.description }}</div>
                <div class="text-text-muted text-xs">
                  {{ new Date(transaction.timestamp).toLocaleTimeString() }}
                </div>
              </div>
              <div class="text-right">
                <div 
                  class="font-medium"
                  :class="{
                    'text-success': transaction.type === 'initial_credit' || transaction.type === 'bet_won',
                    'text-danger': transaction.type === 'bet_placed' || transaction.type === 'bet_lost',
                    'text-text-base': transaction.type === 'bet_cancelled'
                  }"
                >
                  {{ transaction.type === 'bet_placed' || transaction.type === 'bet_lost' ? '-' : '+' }}${{ (transaction.amount / 100).toFixed(2) }}
                </div>
                <div class="text-text-muted text-xs">
                  Balance: ${{ (transaction.balanceAfter / 100).toFixed(2) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useVirtualCurrency } from '../composables/useVirtualCurrency'

const { availableBalance, totalBalance, lockedBalance, recentTransactions } = useVirtualCurrency()

const showDropdown = ref(false)
const showTooltip = ref(false)

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
  const dropdown = document.querySelector('.relative')
  if (dropdown && !dropdown.contains(event.target as Node)) {
    showDropdown.value = false
  }
})
</script>

<style scoped>
/* Add any additional styles if needed */
</style>