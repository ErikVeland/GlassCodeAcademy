# Next to Go Racing - Technical Documentation

**[Live Demo](https://bet.glasscode.academy/)**

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [State Management](#state-management)
5. [Composables](#composables)
6. [Game Simulation](#game-simulation)
7. [Styling](#styling)
8. [Testing](#testing)
9. [Accessibility](#accessibility)
10. [Performance](#performance)
11. [Deployment](#deployment)

## Project Overview

The "Next to Go Racing" application is a real-time racing event dashboard that displays upcoming horse, greyhound, and harness racing events from the Neds API. The application provides live countdown timers, category filtering, and automatic removal of races once they've started.

### Key Features
- Real-time race data fetching from Neds API
- Live countdown timers with automatic cleanup
- Category-based filtering with visual feedback
- Automatic removal of races one minute after their advertised start time
- Responsive design for all device sizes
- Accessible interface with ARIA support
- Dark/light mode toggle
- Meetings view with grouped races by venue
- Betting simulation mode with realistic odds and market dynamics (AI-assisted development)
- Live race commentary updates in header during simulation
- Fully decoupled odds updating system that operates independently of race simulation

## Architecture

The application follows a component-based architecture with Vue 3 Composition API and TypeScript. The architecture is organised as follows:

```
src/
├── components/          # Reusable UI components
├── composables/         # Reusable logic functions
├── stores/              # Pinia state management
├── game/                # Betting and race simulation engines
├── assets/
│   └── styles/          # CSS and SCSS files
├── App.vue              # Root component
└── main.ts              # Application entry point
```

### Data Flow
1. **API Integration**: The application fetches data from the Neds API via the `useFetchRaces` composable
2. **State Management**: Data is stored and managed in the Pinia store
3. **Component Rendering**: Components consume data from the store and render the UI
4. **User Interaction**: User actions trigger store mutations or API calls
5. **Real-time Updates**: Timers and polling keep the data fresh
6. **Simulation Mode**: In simulation mode, the betting engine and race simulation provide dynamic data
7. **Odds Updating**: Odds are updated independently for upcoming races with a realistic market movement simulation
8. **Live Updates**: During race simulation, live commentary updates are displayed in the header

## Components

### App.vue
The root component that provides the main layout structure and coordinates between different views.

**Props**: None
**Emits**: None
**Features**:
- Theme toggle (dark/light mode)
- View switching (races vs meetings)
- Category filtering controls
- Simulation mode toggle
- Live race updates in header with actual runner names
- Next race information display
- Responsive design with proper desktop and mobile layouts

### RaceList.vue
Orchestrates the display of active races in a grid layout, applying sorting and expiry logic.

**Props**: None
**Emits**: None
**Features**:
- Displays exactly 5 races at all times
- Loading, error, and empty states
- Responsive grid layout
- Carousel behaviour for race transitions

### RaceColumn.vue
Displays individual race information in a card format with header, runners, and betting controls.

**Props**:
- `race`: RaceSummary object containing race details
- `isActive`: Boolean indicating if this is the currently focused race
- `isExpired`: Boolean indicating if the race has expired

**Emits**:
- `navigate-next`: When right arrow key is pressed
- `navigate-prev`: When left arrow key is pressed
- `select`: When enter/space is pressed
- `add-to-betslip`: When a runner's odds are clicked
- `race-started`: When the race simulation begins
- `race-finished`: When the race simulation completes

**Features**:
- Race header with category icon and countdown timer
- List of runners with odds and details
- Betting controls and odds trend indicators
- Odds movement visualization charts
- Responsive design
- Race simulation integration
- Proper display of category icons in simulation mode

### RaceHeader.vue
Displays the header section for each race with category icon and countdown timer.

**Props**:
- `meetingName`: Name of the racing venue
- `raceNumber`: Sequential number of the race
- `categoryId`: ID of the race category
- `startTime`: Start time in milliseconds
- `isExpired`: Boolean indicating if the race has expired
- `raceId`: Unique identifier for the race

**Emits**: None
**Features**:
- Category-specific icons (horse, greyhound, harness)
- Live countdown timer
- "LIVE" badge for in-progress races
- Responsive design with category color coding

### RunnerRow.vue
Displays individual runner metadata including name, jockey, and odds.

**Props**:
- `runner`: Runner object with details
- `raceId`: Unique identifier for the race
- `raceName`: Name of the racing venue
- `raceNumber`: Sequential number of the race
- `isExpired`: Boolean indicating if the race has expired

**Emits**: None
**Features**:
- Silk color icon for visual identification
- Runner name and number
- Jockey/driver name and weight
- Odds display with trend indicators (▲/▼)
- Clickable odds buttons for bet placement
- Animation effects for odds changes
- Responsive text display (BT expands to Best Time on larger screens)

### CategoryFilter.vue
Handles toggling between racing categories with visual indication of active state.

**Props**:
- `categories`: Array of category objects

**Emits**:
- `toggle-category`: When a category is selected/deselected

**Features**:
- Visual indication of active categories
- Keyboard navigation support
- ARIA attributes for screen readers
- Responsive design

### ControlBar.vue
Provides filtering controls including search, category filters, and sorting options with responsive layout.

**Props**: None
**Emits**: None
**Features**:
- Search functionality with debounced input
- Category filtering with visual feedback
- Time filtering options
- Sorting controls
- Responsive layout with one-line format on desktop and stacked columns on mobile
- Proper alignment and spacing of controls

### CountdownTimer.vue
Isolated timer component with proper interval cleanup and reactive updates.

**Props**:
- `startTime`: Timestamp when the race starts
- `raceId`: Unique identifier for the race

**Emits**: None
**Features**:
- Live countdown display
- "Starting soon" and "In progress" states
- Proper interval cleanup
- ARIA announcements for time updates
- Visual warning in last 10 seconds

### MeetingsView.vue
Displays races grouped by meeting name with accordion functionality.

**Props**: None
**Emits**: None
**Features**:
- Grouped view by meeting name
- Collapsible sections
- Skeleton loaders during loading state
- Responsive design

### BetPlacer.vue
Interactive betting interface for placing wagers on runners.

**Props**:
- `race`: RaceSummary object containing race details
- `runner`: Runner object with details

**Emits**: None
**Features**:
- Stake input with validation
- Market selection (win/place/each-way)
- Real-time payout calculation
- Betting restrictions based on race status
- Visual feedback for betting actions

### BetslipDrawer.vue
Slide-out panel for managing bet selections and placement.

**Props**: None
**Emits**: None
**Features**:
- Dual-tab interface (Betslip/Pending Bets)
- Real-time stake validation
- Bet placement animations
- Pending bets management with cashout/cancel options
- Responsive design for mobile and desktop

### PendingBetsList.vue
Displays a list of pending bets with management options.

**Props**:
- `bets`: Array of bet objects

**Emits**: None
**Features**:
- Detailed bet information display
- Cashout and cancel functionality
- Visual status indicators

### BalanceWidget.vue
Displays the current virtual currency balance.

**Props**: None
**Emits**: None
**Features**:
- Real-time balance updates
- Visual feedback for balance changes
- Game over detection

### SimulationControls.vue
Provides controls for managing race simulations.

**Props**:
- `race`: RaceSummary object containing race details

**Emits**:
- `start`: When start simulation is requested
- `reset`: When reset simulation is requested

**Features**:
- Start/reset simulation buttons
- Visual feedback for simulation status

## State Management

### Races Store (src/stores/races.ts)
Manages race data and filtering logic.

**State**:
- `races`: Array of RaceSummary objects
- `selectedCategories`: Set of active category IDs
- `loadState`: Current loading state
- `errorMessage`: Error message if any
- `searchQuery`: Current search query
- `timeFilter`: Time filter setting
- `sortOrder`: Sort order setting

**Getters**:
- `activeRaces`: Filtered and sorted active races
- `nextFive`: Next 5 races to display
- `racesByMeeting`: Races grouped by meeting name

**Actions**:
- `fetchRaces`: Fetch races from Neds API
- `toggleCategory`: Toggle category filter
- `setSearchQuery`: Set search query
- `setTimeFilter`: Set time filter
- `setSortOrder`: Set sort order
- `pruneExpired`: Remove expired races
- `startLoops`: Start polling and ticking intervals
- `stopLoops`: Stop polling and ticking intervals
- `reset`: Reset store state

### Bets Store (src/stores/bets.ts)
Manages betting logic and virtual currency.

**State**:
- `engine`: BettingEngine instance
- `showGame`: Whether game mode is enabled
- `useSimulatedData`: Whether to use simulated data
- `lastWonBetId`: ID of last won bet
- `showGameOver`: Whether to show game over dialog

**Getters**:
- `bankroll`: Current bankroll information
- `pendingBets`: Pending bets
- `settledBets`: Settled bets
- `getLastWonBetId`: Last won bet ID
- `isBankrupt`: Whether player is bankrupt

**Actions**:
- `setShowGame`: Set game mode
- `setUseSimulatedData`: Set data mode
- `acceptWelcomeCredits`: Add welcome credits
- `checkGameOver`: Check if game over
- `placeBet`: Place a bet with required parameters
- `cancelBet`: Cancel a bet
- `settleRace`: Settle a race
- `reset`: Reset betting engine
- `getPendingBetsForRace`: Get pending bets for a race
- `cashoutBet`: Cashout a bet

### Simulation Store (src/stores/simulation.ts)
Manages race simulations.

**State**:
- `controllers`: Map of simulation controllers
- `activeRaces`: Set of active race IDs
- `raceStatus`: Map of race statuses
- `speedMultipliers`: Map of speed multipliers
- `raceProgress`: Map of race progress data

**Getters**:
- `getSimulationController`: Get simulation controller
- `isRaceActive`: Check if race is active
- `getRaceStatus`: Get race status
- `getSpeedMultiplier`: Get speed multiplier
- `getRaceLeader`: Get race leader

**Actions**:
- `addSimulationController`: Add simulation controller
- `removeSimulationController`: Remove simulation controller
- `startSimulation`: Start simulation
- `stopSimulation`: Stop simulation
- `finishSimulation`: Finish simulation
- `setSpeedMultiplier`: Set speed multiplier
- `updateRaceProgress`: Update race progress
- `getRaceProgress`: Get race progress
- `resetSimulation`: Reset simulation
- `resetAllSimulations`: Reset all simulations

## Composables

### useFetchRaces (src/composables/useFetchRaces.ts)
Handles race data fetching with error handling and retry logic.

**Functions**:
- `fetchRaces`: Fetch races from API with retry mechanism

### useCountdown (src/composables/useCountdown.ts)
Manages countdown timer logic.

**Functions**:
- `useCountdown`: Create countdown timer with reactive updates

### useOddsSimulation (src/composables/useOddsSimulation.ts)
Manages odds simulation for runners with realistic market movements.

**Functions**:
- `initializeOddsSimulation`: Initialize odds simulation for a race
- `updateOdds`: Update odds for a race
- `getSimulatedRunners`: Get simulated runners for a race
- `resetSimulation`: Reset simulation for a race
- `generateRandomizedRunners`: Generate randomized runners

### useOddsUpdater (src/composables/useOddsUpdater.ts)
Manages odds update intervals with a fully decoupled system that operates independently of race simulation.

**Functions**:
- `registerCountdownRace`: Register race for odds updates
- `unregisterCountdownRace`: Unregister race from odds updates
- `startOddsUpdates`: Start odds updates for a race with 1.5 second intervals
- `stopOddsUpdates`: Stop odds updates for a race
- `updateRaceOdds`: Update odds for a race with realistic market movements (±10% volatility)

**Features**:
- Fully decoupled from race simulation
- Updates odds every 1.5 seconds for realistic market movements
- Reduces market volatility from ±15% to ±10% for more realistic fluctuations
- Only updates odds during countdown phase, not during live races
- Automatic cleanup of intervals when races are no longer in countdown status

### useRaceSimulation (src/composables/useRaceSimulation.ts)
Manages race simulation lifecycle.

**Functions**:
- `createSimulation`: Create race simulation
- `getSimulation`: Get race simulation
- `removeSimulation`: Remove race simulation
- `startSimulation`: Start race simulation
- `stopSimulation`: Stop race simulation
- `resetSimulation`: Reset race simulation

### useBettingLogic (src/composables/useBettingLogic.ts)
Provides betting-related utility functions.

**Functions**:
- `calculateEstimatedReturn`: Calculate estimated return for a bet
- `canPlaceBets`: Check if bets can be placed

### useVirtualCurrency (src/composables/useVirtualCurrency.ts)
Manages virtual currency state.

**Functions**:
- `useVirtualCurrency`: Create virtual currency composable

### useAnimationEffects (src/composables/useAnimationEffects.ts)
Provides animation effects.

**Functions**:
- `useAnimationEffects`: Create animation effects composable

## Game Simulation

### Betting Engine (src/game/bettingSimulator.ts)
Core betting engine that handles all betting logic with required parameters for all betting methods.

**Features**:
- Support for WIN, PLACE, EACH_WAY, MULTI, QUINELLA, TRIFECTA, and FIRST_FOUR bet types
- Realistic place terms by category
- Configurable betting limits
- Cashout functionality with fees
- Dead-heat rule implementation
- Progressive settlement for multi-leg bets
- Exotic bet settlement logic
- All betting methods now require all parameters (no more hardcoded defaults)

**Classes**:
- `BettingEngine`: Main betting engine class

**Interfaces**:
- `RunnerQuote`: Runner odds information
- `RaceQuote`: Race information for betting
- `RaceResult`: Race result information
- `BankrollSnapshot`: Bankroll information
- `BetLeg`: Bet leg information
- `BetBase`: Base bet interface
- `SingleBet`: Single bet interface
- `MultiBet`: Multi bet interface
- `ExoticBet`: Exotic bet interface
- `Bet`: Union of bet types
- `SettlementRecord`: Settlement record
- `BettingConfig`: Betting configuration

**Key Changes**:
- The [placeBet](file:///Users/veland/Downloads/entain/src/game/bettingSimulator.ts#L334-334) method now requires all parameters (raceId, runnerId, stake, odds, advertisedStartMs, meetingName, raceNumber, runnerName, categoryId) instead of using defaults
- Enhanced validation to ensure all required betting information is provided
- Improved error handling for invalid parameters

### Race Simulation Engine (src/game/simulatedRace.ts)
Deterministic race simulation engine.

**Features**:
- Category-specific race durations
- Odds-based probability normalization
- Realistic pace curves with acceleration, cruise, and final kick phases
- Environmental factors (weather, track conditions)
- Stamina modeling
- Dead-heat handling
- Deterministic outcomes with seedable randomness

**Classes**:
- `createRaceSimulation`: Factory function for race simulations

**Interfaces**:
- `WeatherConditions`: Weather conditions
- `TrackCondition`: Track conditions
- `RunnerInput`: Runner input data
- `RaceInput`: Race input data
- `Tick`: Simulation tick data
- `Result`: Simulation result data
- `SimulationController`: Simulation controller interface

## Styling

### TailwindCSS Configuration
Custom TailwindCSS configuration with design tokens.

**Colors**:
- `brand-primary`: Primary brand color (#F97316)
- `brand-secondary`: Secondary brand color (#0F172A)
- `brand-accent`: Accent color (#FACC15)
- `surface`: Surface colors for UI elements
- `text`: Text colors for readability

**Responsive Design**:
- Mobile-first approach
- Three-column grid layout on desktop
- Two-column grid layout on tablet
- Single-column stacked layout on mobile
- Responsive filter bar with one-line layout on desktop and stacked columns on mobile

### SCSS Design Tokens
SCSS variables for consistent styling across the application.

**Tokens**:
- Color palette
- Typography scales
- Spacing system
- Border radii
- Shadows
- Transitions

### Utility Classes
Additional CSS utility classes for consistent styling.

**Features**:
- Background color utilities for all theme colors
- Text color utilities for all theme colors
- Border color utilities for all theme colors
- Fill color utilities for SVG icons
- Spacing utilities (padding and margin)
- Border radius utilities
- Shadow utilities
- Transition utilities
- Animation utilities for odds changes
- Opacity utilities
- Focus style utilities

## Testing

### Test Framework
Vitest with jsdom environment for browser simulation.

### Test Coverage
All 63 tests across 18 test files are currently passing.

### Test Structure
```
src/
├── components/
│   └── __tests__/
├── composables/
│   └── __tests__/
├── stores/
│   └── __tests__/
└── test/
```

### Key Test Areas
- Component rendering and behaviour
- State management
- Composable functions
- Betting engine logic
- Race simulation
- Utility functions

## Accessibility

### WCAG Compliance
The application follows WCAG 2.1 AA guidelines.

### Features
- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- Color contrast ratios
- Focus management
- Skip links
- Semantic HTML

## Performance

### Optimization Techniques
- Component-level reactivity
- Efficient state management
- Proper interval cleanup
- Lazy loading where appropriate
- Code splitting
- Asset optimization

### Metrics
- Fast initial load
- Smooth animations
- Responsive interactions
- Efficient memory usage

## Deployment

### Build Process
Vite build process with TypeScript compilation.

### Hosting
Static files can be hosted on any static hosting service.

### Environment Variables
No sensitive environment variables required.

### CI/CD
Ready for integration with CI/CD pipelines.