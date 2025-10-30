import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import RaceList from '../RaceList.vue'

describe('RaceList', () => {
  it('renders skeleton loaders when loading and no races', () => {
    const wrapper = mount(RaceList, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              races: {
                loadState: 'loading',
                races: []
              }
            },
            createSpy: () => {}
          })
        ]
      }
    })

    // Check that skeleton loaders are shown
    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
  })

  it('shows error message when there is an error', () => {
    const wrapper = mount(RaceList, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              races: {
                loadState: 'error',
                errorMessage: 'Test error message'
              }
            },
            createSpy: () => {}
          })
        ]
      }
    })

    // Check that error message is shown
    expect(wrapper.text()).toContain('Error loading races')
    expect(wrapper.text()).toContain('Test error message')
  })

  it('shows empty state when no races available', () => {
    const wrapper = mount(RaceList, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              races: {
                loadState: 'ready',
                races: []
              }
            },
            createSpy: () => {}
          })
        ]
      }
    })

    // Check that empty state is shown
    expect(wrapper.text()).toContain('No races available')
  })

  it('renders race items when races are available', () => {
    const wrapper = mount(RaceList, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              races: {
                loadState: 'ready',
                races: [
                  {
                    id: '1',
                    meeting_name: 'WARRAGUL',
                    race_number: 12,
                    advertised_start_ms: Date.now() + 120000,
                    category_id: '4a2788f8-e825-4d36-9894-efd4baf1cfae'
                  },
                  {
                    id: '2',
                    meeting_name: 'KOLKATA',
                    race_number: 1,
                    advertised_start_ms: Date.now() + 180000,
                    category_id: '9daef0d7-bf3c-4f50-921d-8e818c60fe61'
                  },
                  {
                    id: '3',
                    meeting_name: 'KILMORE',
                    race_number: 2,
                    advertised_start_ms: Date.now() + 240000,
                    category_id: '161d9be2-e909-4326-8c2c-35ed71fb460b'
                  }
                ],
                selectedCategories: new Set([
                  '4a2788f8-e825-4d36-9894-efd4baf1cfae',
                  '9daef0d7-bf3c-4f50-921d-8e818c60fe61',
                  '161d9be2-e909-4326-8c2c-35ed71fb460b'
                ])
              }
            },
            createSpy: () => {}
          })
        ]
      }
    })

    // Check that race items are rendered
    expect(wrapper.findAllComponents({ name: 'RaceColumn' }).length).toBe(3)
  })

  it('renders races in a grid layout', () => {
    const wrapper = mount(RaceList, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              races: {
                loadState: 'ready',
                races: [
                  {
                    id: '1',
                    meeting_name: 'WARRAGUL',
                    race_number: 12,
                    advertised_start_ms: Date.now() + 120000,
                    category_id: '4a2788f8-e825-4d36-9894-efd4baf1cfae'
                  },
                  {
                    id: '2',
                    meeting_name: 'KOLKATA',
                    race_number: 1,
                    advertised_start_ms: Date.now() + 180000,
                    category_id: '9daef0d7-bf3c-4f50-921d-8e818c60fe61'
                  },
                  {
                    id: '3',
                    meeting_name: 'KILMORE',
                    race_number: 2,
                    advertised_start_ms: Date.now() + 240000,
                    category_id: '161d9be2-e909-4326-8c2c-35ed71fb460b'
                  }
                ],
                selectedCategories: new Set([
                  '4a2788f8-e825-4d36-9894-efd4baf1cfae',
                  '9daef0d7-bf3c-4f50-921d-8e818c60fe61',
                  '161d9be2-e909-4326-8c2c-35ed71fb460b'
                ])
              }
            },
            createSpy: () => {}
          })
        ]
      }
    })

    // Check that races are rendered in a grid layout
    expect(wrapper.find('.grid').exists()).toBe(true)
  })
})