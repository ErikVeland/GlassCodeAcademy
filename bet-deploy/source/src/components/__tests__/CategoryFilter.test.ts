import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CategoryFilter from '../CategoryFilter.vue'
import { useRacesStore, CATEGORY_IDS } from '../../stores/races'

describe('CategoryFilter', () => {
  beforeEach(() => {
    // Create a new pinia instance and make it active
    setActivePinia(createPinia())
  })

  it('renders all category buttons', () => {
    const wrapper = mount(CategoryFilter)
    
    // Check that all three category buttons are rendered
    expect(wrapper.findAll('button')).toHaveLength(3)
    
    // Check that the buttons contain the correct text
    const buttons = wrapper.findAll('button')
    expect(buttons[0].text()).toContain('Horse')
    expect(buttons[1].text()).toContain('Greyhound')
    expect(buttons[2].text()).toContain('Harness')
  })

  it('shows correct icons for each category', () => {
    const wrapper = mount(CategoryFilter)
    
    // Check that the buttons contain the correct icons
    const buttons = wrapper.findAll('button')
    expect(buttons[0].text()).toContain('🏇')
    expect(buttons[1].text()).toContain('🐕')
    expect(buttons[2].text()).toContain('🛞')
  })

  it('toggles category selection', async () => {
    const wrapper = mount(CategoryFilter)
    const store = useRacesStore()
    
    // Initially all categories should be selected (based on store initialization)
    expect(store.selectedCategories.has(CATEGORY_IDS.HORSE)).toBe(true)
    expect(store.selectedCategories.has(CATEGORY_IDS.GREYHOUND)).toBe(true)
    expect(store.selectedCategories.has(CATEGORY_IDS.HARNESS)).toBe(true)
    
    // Find the Horse button and click it to deselect
    const horseButton = wrapper.findAll('button').at(0)
    await horseButton.trigger('click')
    
    // Check that the horse category is now deselected
    expect(store.selectedCategories.has(CATEGORY_IDS.HORSE)).toBe(false)
    
    // Click the same button again to select
    await horseButton.trigger('click')
    
    // Check that the horse category is now selected
    expect(store.selectedCategories.has(CATEGORY_IDS.HORSE)).toBe(true)
  })
})