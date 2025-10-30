import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CountdownTimer from '../CountdownTimer.vue'

// Mock the useCountdown composable
vi.mock('../../composables/useCountdown', () => ({
  useCountdown: vi.fn((startTime: number) => {
    const now = Date.now()
    const timeDiff = startTime - now
    
    if (timeDiff <= 0) {
      if (timeDiff <= -60000) {
        return {
          formattedTime: { value: 'In progress' },
          isStartingSoon: { value: false },
          isInProgress: { value: true }
        }
      } else {
        return {
          formattedTime: { value: 'Starting soon' },
          isStartingSoon: { value: true },
          isInProgress: { value: false }
        }
      }
    } else {
      const minutes = Math.floor(timeDiff / 60000)
      const seconds = Math.floor((timeDiff % 60000) / 1000)
      return {
        formattedTime: { value: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}` },
        isStartingSoon: { value: minutes === 0 && seconds < 60 },
        isInProgress: { value: false }
      }
    }
  })
}))

describe('CountdownTimer', () => {
  it('renders properly', () => {
    const wrapper = mount(CountdownTimer, {
      props: {
        startTime: Date.now() + 120000 // 2 minutes in the future
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('displays formatted time correctly', () => {
    const wrapper = mount(CountdownTimer, {
      props: {
        startTime: Date.now() + 120000 // 2 minutes in the future
      }
    })

    // The exact time might vary slightly, so we check for the presence of time format
    expect(wrapper.text()).toMatch(/\d{2}:\d{2}/)
  })

  it('shows "Starting soon" when race is about to start', () => {
    const wrapper = mount(CountdownTimer, {
      props: {
        startTime: Date.now() + 30000 // 30 seconds in the future
      }
    })

    expect(wrapper.text()).toContain('Starting soon')
  })

  it('shows "In progress" when race has started', () => {
    const wrapper = mount(CountdownTimer, {
      props: {
        startTime: Date.now() - 70000 // 70 seconds ago
      }
    })

    expect(wrapper.text()).toContain('In progress')
  })
})