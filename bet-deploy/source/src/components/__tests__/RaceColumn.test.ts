import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RaceColumn from '../RaceColumn.vue'
import { createTestingPinia } from '@pinia/testing'
import { useRacesStore } from '../../stores/races'

// Mock race data
const mockRace = {
  id: '1',
  meeting_name: 'WARRAGUL',
  race_number: 12,
  advertised_start_ms: Date.now() + 120000, // 2 minutes in the future
  category_id: '4a2788f8-e825-4d36-9894-efd4baf1cfae' // Horse
}

describe('RaceColumn', () => {
  it('renders properly with race data', () => {
    const wrapper = mount(RaceColumn, {
      props: {
        race: mockRace
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: () => {}
          })
        ]
      }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('WARRAGUL')
    expect(wrapper.text()).toContain('12')
  })

  it('displays runners', () => {
    const wrapper = mount(RaceColumn, {
      props: {
        race: mockRace
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: () => {}
          })
        ]
      }
    })

    // Check that runner rows are rendered
    expect(wrapper.findAll('.flex.items-center.py-2')).length > 0
  })
})