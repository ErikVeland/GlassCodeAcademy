import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RaceHeader from '../RaceHeader.vue'
import { CATEGORY_IDS } from '../../stores/races'

describe('RaceHeader', () => {
  it('renders properly with horse category', () => {
    const wrapper = mount(RaceHeader, {
      props: {
        meetingName: 'WARRAGUL',
        raceNumber: 12,
        categoryId: CATEGORY_IDS.HORSE,
        startTime: Date.now() + 120000, // 2 minutes in the future
        raceId: 'race-1'
      }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('WARRAGUL')
    expect(wrapper.text()).toContain('12')
    expect(wrapper.text()).toContain('🏇')
  })

  it('renders properly with greyhound category', () => {
    const wrapper = mount(RaceHeader, {
      props: {
        meetingName: 'KOLKATA',
        raceNumber: 1,
        categoryId: CATEGORY_IDS.GREYHOUND,
        startTime: Date.now() + 120000, // 2 minutes in the future
        raceId: 'race-2'
      }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('KOLKATA')
    expect(wrapper.text()).toContain('1')
    expect(wrapper.text()).toContain('🐕')
  })

  it('renders properly with harness category', () => {
    const wrapper = mount(RaceHeader, {
      props: {
        meetingName: 'KILMORE',
        raceNumber: 2,
        categoryId: CATEGORY_IDS.HARNESS,
        startTime: Date.now() + 120000, // 2 minutes in the future
        raceId: 'race-3'
      }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('KILMORE')
    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).toContain('🛞')
  })

  it('displays countdown timer', () => {
    const wrapper = mount(RaceHeader, {
      props: {
        meetingName: 'WARRAGUL',
        raceNumber: 12,
        categoryId: CATEGORY_IDS.HORSE,
        startTime: Date.now() + 120000, // 2 minutes in the future
        raceId: 'race-4'
      }
    })

    // The countdown should display in MM:SS format
    expect(wrapper.text()).toMatch(/\d{2}:\d{2}/)
  })
})