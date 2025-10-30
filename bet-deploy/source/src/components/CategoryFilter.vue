<template>
  <div class="flex flex-wrap gap-3 mb-8 w-full" role="group" :aria-label="$t('categories.selectAll')">
    <button
      v-for="category in categories"
      :key="category.id"
      @click="toggleCategory(category.id)"
      class="px-4 py-3 rounded-xl2 font-medium transition-all duration-300 flex items-center focus:outline-none focus:ring-2 focus:ring-brand-primary transform hover:scale-105 min-w-[100px] justify-between flex-1"
      :class="[
        category.active 
          ? 'text-text-inverse shadow-card' 
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
          class="text-[36px] mr-3"
          :class="category.active ? 'text-white' : 'text-horse'"
        >🏇</span>
        <span 
          v-else-if="category.name === 'greyhound'" 
          class="text-[36px] mr-3"
          :class="category.active ? 'text-white' : 'text-greyhound'"
        >🐕</span>
        <span 
          v-else-if="category.name === 'harness'" 
          class="text-[36px] mr-3"
          :class="category.active ? 'text-white' : 'text-harness'"
        >🛞</span>
        
        <span class="truncate">{{ $t(`categories.${category.name}`) }}</span>
      </div>
      
      <!-- Emoji tickbox -->
      <span 
        class="text-lg ml-2"
        :class="{ 'animate-bounce-in': category.active }"
      >
        {{ category.active ? '✅' : '⭕' }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRacesStore, CATEGORY_IDS } from '../stores/races'

const { t } = useI18n()
const store = useRacesStore()

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
</script>