<template>
  <div class="bg-surface-raised shadow-card p-4 mb-6 transition-all duration-300">
    <!-- Main control bar with responsive layout -->
    <div class="flex flex-col sm:flex-row gap-4 w-full items-start sm:items-center">
      <!-- Search section - full width on mobile, auto on desktop -->
      <div class="relative w-full sm:w-auto flex-grow">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span class="text-text-muted text-sm">🔍</span>
        </div>
        <input
          v-model="localSearchQuery"
          @input="updateSearchQuery"
          type="text"
          :placeholder="$t('races.searchPlaceholder')"
          class="w-full pl-10 pr-8 py-2 bg-surface text-text-base rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-200"
          :aria-label="$t('races.searchPlaceholder')"
        />
        <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
          <span v-if="localSearchQuery" @click="clearSearch" class="text-text-muted cursor-pointer hover:text-brand-primary transition-colors text-sm">✕</span>
        </div>
      </div>
      
      <!-- Filter and control sections - horizontal on desktop -->
      <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full sm:w-auto">
        <!-- Category filters - one line on desktop -->
        <div class="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            v-for="category in categories"
            :key="category.id"
            @click="toggleCategory(category.id)"
            class="px-3 py-1 rounded-lg font-medium transition-all duration-200 flex items-center focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm min-w-[80px] w-auto flex-none justify-start"
            :class="[
              category.active 
                ? 'text-text-inverse shadow-sm' 
                : 'text-text-base hover:bg-surface-sunken',
              category.bgClass
            ]"
            :aria-pressed="category.active"
            :title="`${category.active ? $t('categories.selectAll') : $t('categories.selectAll')} ${$t(`categories.${category.name}`)} ${$t('meetings.races')}`"
          >
            <div class="flex items-center">
              <!-- Category icon -->
              <span 
                v-if="category.name === 'horse'" 
                class="text-lg mr-1.5 hidden sm:inline"
                :class="category.active ? 'text-white' : 'text-horse'"
              >🏇</span>
              <span 
                v-else-if="category.name === 'greyhound'" 
                class="text-lg mr-1.5 hidden sm:inline"
                :class="category.active ? 'text-white' : 'text-greyhound'"
              >🐕</span>
              <span 
                v-else-if="category.name === 'harness'" 
                class="text-lg mr-1.5 hidden sm:inline"
                :class="category.active ? 'text-white' : 'text-harness'"
              >🛞</span>
              
              <span class="truncate">{{ $t(`categories.${category.name}`) }}</span>
            </div>
            
            <!-- Emoji tickbox -->
            <span 
              class="text-sm ml-1"
              :class="{ 'animate-bounce-in': category.active }"
            >
              {{ category.active ? '✓' : '○' }}
            </span>
          </button>
        </div>
        
        <!-- Time filter and sort order - horizontal on desktop -->
        <div class="flex flex-row gap-3 w-full sm:w-auto">
          <div class="relative w-full sm:w-auto">
            <select
              v-model="localTimeFilter"
              @change="updateTimeFilter"
              class="appearance-none bg-surface text-text-base rounded-lg py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-200 cursor-pointer w-full"
              :aria-label="$t('races.sortBy')"
            >
              <option value="all">{{ $t('races.allTimes') }}</option>
              <option value="next-hour">{{ $t('races.nextHour') }}</option>
              <option value="next-2-hours">{{ $t('races.next2Hours') }}</option>
              <option value="next-4-hours">{{ $t('races.next4Hours') }}</option>
            </select>
          </div>
          
          <div class="relative w-full sm:w-auto">
            <select
              v-model="localSortOrder"
              @change="updateSortOrder"
              class="appearance-none bg-surface text-text-base rounded-lg py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-200 cursor-pointer w-full"
              :aria-label="$t('races.sortBy')"
            >
              <option value="time-asc">{{ $t('races.timeSoonest') }}</option>
              <option value="time-desc">{{ $t('races.timeLatest') }}</option>
              <option value="name-asc">{{ $t('races.nameAZ') }}</option>
              <option value="name-desc">{{ $t('races.nameZA') }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRacesStore, CATEGORY_IDS } from '../stores/races'

const { t } = useI18n()
const store = useRacesStore()

// Local state for form controls (to enable debouncing)
const localSearchQuery = ref(store.searchQuery)
const localTimeFilter = ref(store.timeFilter)
const localSortOrder = ref(store.sortOrder)

// Update store when local search query changes (with debounce)
let searchDebounce: number | null = null
const updateSearchQuery = () => {
  if (searchDebounce) {
    clearTimeout(searchDebounce)
  }
  searchDebounce = window.setTimeout(() => {
    store.setSearchQuery(localSearchQuery.value)
  }, 300)
}

// Clear search
const clearSearch = () => {
  localSearchQuery.value = ''
  store.setSearchQuery('')
}

// Update store when time filter changes
const updateTimeFilter = () => {
  store.setTimeFilter(localTimeFilter.value as any)
}

// Update store when sort order changes
const updateSortOrder = () => {
  store.setSortOrder(localSortOrder.value as any)
}

// Category filters
const categories = computed(() => [
  {
    id: CATEGORY_IDS.HORSE,
    name: 'horse',
    active: store.selectedCategories.has(CATEGORY_IDS.HORSE),
    bgClass: 'bg-horse',
  },
  {
    id: CATEGORY_IDS.GREYHOUND,
    name: 'greyhound',
    active: store.selectedCategories.has(CATEGORY_IDS.GREYHOUND),
    bgClass: 'bg-greyhound',
  },
  {
    id: CATEGORY_IDS.HARNESS,
    name: 'harness',
    active: store.selectedCategories.has(CATEGORY_IDS.HARNESS),
    bgClass: 'bg-harness',
  }
])

const toggleCategory = (categoryId: string) => {
  store.toggleCategory(categoryId)
}

// Watch for external changes to search query
watch(() => store.searchQuery, (newVal) => {
  localSearchQuery.value = newVal
})
</script>

<style scoped>
/* Custom select arrow */
select {
  background-image: linear-gradient(45deg, transparent 50%, currentColor 50%),
    linear-gradient(135deg, currentColor 50%, transparent 50%);
  background-position: calc(100% - 12px) calc(0.7em + 1px),
    calc(100% - 7px) calc(0.7em + 1px);
  background-size: 4px 4px, 4px 4px;
  background-repeat: no-repeat;
}
</style>