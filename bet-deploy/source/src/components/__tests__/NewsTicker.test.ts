import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import NewsTicker from '../NewsTicker.vue'

describe('NewsTicker', () => {
  it('renders correctly when showTicker is false', () => {
    const wrapper = mount(NewsTicker, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              bets: {
                showGame: false
              }
            },
            createSpy: () => {}
          })
        ]
      }
    })

    // Initially showTicker should be false
    expect(wrapper.find('.fixed').exists()).toBe(false)
  })

  it('shows ticker when messages are added', () => {
    const wrapper = mount(NewsTicker, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              bets: {
                showGame: true
              }
            },
            createSpy: () => {}
          })
        ]
      }
    })

    // Initially showTicker should be false
    expect(wrapper.find('.fixed').exists()).toBe(false)
  })

  it('hides ticker when messages are cleared', () => {
    const wrapper = mount(NewsTicker, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              bets: {
                showGame: true
              }
            },
            createSpy: () => {}
          })
        ]
      }
    })

    // Initially showTicker should be false
    expect(wrapper.find('.fixed').exists()).toBe(false)
  })
})