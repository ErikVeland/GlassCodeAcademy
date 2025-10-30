import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import MeetingsView from '../MeetingsView.vue'

describe('MeetingsView', () => {
  it('renders properly', () => {
    const wrapper = mount(MeetingsView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: () => {}
          })
        ]
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('shows skeleton loaders when loading', () => {
    const wrapper = mount(MeetingsView, {
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
    const wrapper = mount(MeetingsView, {
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
    expect(wrapper.text()).toContain('Error loading meetings')
    expect(wrapper.text()).toContain('Test error message')
  })

  it('shows empty state when no meetings available', () => {
    const wrapper = mount(MeetingsView, {
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
    expect(wrapper.text()).toContain('No meetings available')
  })
})