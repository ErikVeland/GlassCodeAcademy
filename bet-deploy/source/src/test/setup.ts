import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Set up i18n for tests
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: {
      app: {
        title: 'RaceHub - Advanced Racing Dashboard',
        footer: 'Racing data provided by Neds API'
      },
      races: {
        noRaces: 'No races available',
        checkBack: 'Please check back later',
        error: 'Error loading races',
        tryAgain: 'Try Again',
        live: 'LIVE',
        startingSoon: 'Starting soon',
        inProgress: 'In progress',
        searchPlaceholder: 'Search meetings, races, or runners...',
        allTimes: 'All Times',
        nextHour: 'Next Hour',
        next2Hours: 'Next 2 Hours',
        next4Hours: 'Next 4 Hours',
        sortBy: 'Sort by',
        timeSoonest: 'Time (Soonest First)',
        timeLatest: 'Time (Latest First)',
        nameAZ: 'Meeting Name (A-Z)',
        nameZA: 'Meeting Name (Z-A)',
        previous: 'Previous',
        next: 'Next'
      },
      meetings: {
        noMeetings: 'No meetings available',
        error: 'Error loading meetings',
        races: 'race | races'
      },
      categories: {
        horse: 'Horse',
        greyhound: 'Greyhound',
        harness: 'Harness',
        selectAll: 'Select All'
      },
      views: {
        nextFive: 'Next 5 Races',
        meetings: 'Meetings'
      },
      theme: {
        switchToLight: 'Switch to light mode',
        switchToDark: 'Switch to dark mode',
        highContrast: 'High contrast mode'
      },
      game: {
        toggleOn: 'Game ON',
        toggleOff: 'Game OFF',
        addToBetslip: 'Add to betslip',
        odds: 'Odds',
        placeBet: 'Place Bet',
        at: 'at',
        bestTime: 'Best Time'
      },
      accessibility: {
        skipToMain: 'Skip to main content',
        skipToRaces: 'Skip to race list',
        skipToMeetings: 'Skip to meetings view'
      }
    }
  }
})

// Configure Vue Test Utils to use i18n
config.global.plugins = [i18n]