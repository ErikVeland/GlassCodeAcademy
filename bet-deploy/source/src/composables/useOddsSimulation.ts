// src/composables/useOddsSimulation.ts
import { ref, Ref, watch } from 'vue'
import { type RunnerInput } from '../game/simulatedRace'

// Define the odds trend types
export type OddsTrend = 'up' | 'down' | 'none'

// Define a runner with simulated odds
export interface SimulatedRunner {
  id: string
  number: number
  name: string
  weight: string
  jockey: string
  odds: number | 'SP' // Changed back to number | 'SP' to match expected interface
  oddsTrend: OddsTrend
  silkColor: string
  bestTime?: string
}

// Define odds simulation state
interface OddsSimulationState {
  runners: Record<string, SimulatedRunner>
  lastUpdate: number
}

// Create a singleton instance of the simulation state
const simulations = ref<Record<string, OddsSimulationState>>({})

// Horse jockey names
const horseJockeyNames = [
  'J: R Vaibhav', 'J: Sarah Johnson', 'J: Michael Chen', 'J: Emma Wilson',
  'J: David Thompson', 'J: Lisa Anderson', 'J: James Parker', 'J: Olivia Smith',
  'J: Robert King', 'J: Jennifer Lee', 'J: William Wright', 'J: Amanda Clark',
  'J: Thomas Brown', 'J: Margaret Davis', 'J: Christopher Wilson', 'J: Patricia Miller',
  'J: Daniel Taylor', 'J: Linda Martinez', 'J: Matthew Anderson', 'J: Barbara Thomas',
  'J: Anthony Garcia', 'J: Susan Rodriguez', 'J: Mark Wilson', 'J: Betty Lopez',
  'J: Paul Martinez', 'J: Dorothy Hernandez', 'J: Steven Gonzalez', 'J: Helen Perez',
  'J: Andrew Taylor', 'J: Carol Jackson', 'J: Kenneth Moore', 'J: Ruth Martin',
  'J: Joshua Lee', 'J: Sharon Thompson', 'J: Kevin White', 'J: Catherine Harris'
]

// Human names for harness drivers
const harnessDriverNames = [
  'D: Robert Mitchell', 'D: Jennifer Taylor', 'D: William Brown', 'D: Amanda Davis',
  'D: Christopher Wilson', 'D: Stephanie Moore', 'D: Matthew Anderson', 'D: Nicole Thomas',
  'D: Daniel Jackson', 'D: Michelle White', 'D: Anthony Harris', 'D: Jessica Martin',
  'D: David Thompson', 'D: Sarah Johnson', 'D: James Parker', 'D: Emily Clark',
  'D: Michael Chen', 'D: Lisa Anderson', 'D: John Wilson', 'D: Mary Davis',
  'D: Richard Martinez', 'D: Linda Rodriguez', 'D: Charles Hernandez', 'D: Patricia Lopez',
  'D: Joseph Gonzalez', 'D: Barbara Perez', 'D: Thomas Taylor', 'D: Susan Jackson',
  'D: Christopher Lee', 'D: Margaret Thompson', 'D: Daniel White', 'D: Dorothy Harris',
  'D: Matthew Martin', 'D: Lisa Garcia', 'D: Anthony Martinez', 'D: Karen Rodriguez'
]

// Greyhound best times (in seconds)
const greyhoundBestTimes = [
  '29.56s', '30.12s', '31.04s', '29.87s', '30.45s', '31.23s', '29.98s', '30.67s', 
  '29.76s', '30.34s', '31.12s', '29.91s', '30.23s', '31.45s', '29.67s', '30.78s',
  '30.01s', '31.34s', '29.89s', '30.56s', '31.01s', '29.78s', '30.89s', '31.22s',
  '30.15s', '31.56s', '29.82s', '30.63s', '31.09s', '29.94s', '30.71s', '31.33s',
  '30.08s', '31.41s', '29.73s', '30.52s', '31.18s', '29.85s', '30.69s', '31.27s'
]

// Horse weights (in kg)
const horseWeights = [
  '55kg', '56kg', '57kg', '58kg', '59kg', '60kg', '61kg', '62kg', 
  '54kg', '63kg', '53kg', '64kg', '52kg', '65kg', '51kg', '66kg',
  '50kg', '67kg', '49kg', '68kg', '48kg', '69kg', '47kg', '70kg',
  '46kg', '71kg', '45kg', '72kg', '44kg', '73kg', '43kg', '74kg',
  '42kg', '75kg', '41kg', '76kg', '40kg', '77kg', '39kg', '78kg'
]

// Silk colors
const silkColors = [
  'bg-blue-500', 'bg-green-500', 'bg-pink-500', 'bg-yellow-500', 'bg-purple-500',
  'bg-red-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500',
  'bg-lime-500', 'bg-rose-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
  'bg-fuchsia-500', 'bg-sky-500', 'bg-rose-600', 'bg-emerald-600', 'bg-violet-600',
  'bg-amber-600', 'bg-fuchsia-600', 'bg-sky-600', 'bg-blue-600', 'bg-green-600',
  'bg-pink-600', 'bg-yellow-600', 'bg-purple-600', 'bg-red-600', 'bg-indigo-600'
]

// More creative and realistic horse names based on real examples
const horseNames = [
  // Creative racehorse names from the list
  'Mane Event', 'Stable Genius', 'Hay Girl Hay', 'Usain Colt', 'Giddy Upstart',
  'Foal Play', 'Fifty Shades of Hay', 'Sir Trot-A-Lot', 'Hoof Hearted', 'Colt Shoulder',
  'Neigh Sayer', 'Long Face Larry', 'Moet & Gallop', 'Haywire Heart', 'Hoof It Holmes',
  'Marely There', 'Glue Factory Escapee', 'Bridle Party', 'Clip Clop Hustle', 'Whinny the Pooh',
  'Hay Fever Dream', 'Saddlesore Sunday', 'Gallopagos Island', 'Buckaroo Banzai', 'Trotter Swift',
  'Canterbury Tales', 'Foal Metal Jacket', 'Sir Prance-A-Lot', 'Jockey Balboa', 'Girthquake',
  'Oats So Fast', 'Galloping Gourmet', 'Mane Attraction', 'Winny Mandela', 'Reign Supreme',
  'Hay Jude', 'Stirrup Trouble', 'Hoofprints in Sand', 'Pasture Bedtime', 'Jockey Horror Show',
  'Filly Jean King', 'Big Neigh Energy', 'Nayomi Campbell', 'The Gallopnik', 'Whinny Kravitz',
  'Bridle of Frankenstein', 'Whip It Real Good', 'Equestrian Aggression', 'Foal Nelson', 'Haydon\'t Stop Believin\'',
  
  // Realistic/character themed
  'Canya Negotiate', 'No Bail Jester', 'Test Drive', 'Eastern Advance', 'Fly Eaglerose',
  'Ballymac Brett', 'Skywalker Tino', 'The Yellow Peril', 'Qwerty', 'Tex Brit',
  'Ginny\'s Run', 'Ava\'s Bluey', 'Vicious Boy', 'Sugar Boo', 'Welloiled',
  'Jack Mannix', 'Dawson Shard Nz', 'Royal Ruby', 'Mystic Moon', 'Golden Galaxy'
]

// More creative and realistic greyhound names based on real examples
const greyhoundNames = [
  'Zoomerang', 'Bark Ruffalo', 'Chasin\' Pavements', 'Greta Runberg', 'Fast and Furryous',
  'Snaccident Waiting', 'Whippet Good', 'Dogtor Strange', 'Paw Patrol Tax Fraud',
  'Bite Club', 'Holy Sniff', 'Tracktopus Prime', 'Ruff McGraw', 'Lick James',
  'Fetchual Healing', 'Bark Wahlberg', 'Puppercut Deluxe', 'Gritty Committee', 'K9 West',
  'The Great Catsby', 'Collateral Beagle', 'Sit Happens', 'Goober Supreme', 'Fleas Navidad',
  'Tails from the Crypt', 'Walk of Shamehound', 'Sniff Happens', 'Labrathor', 'Noodle of Fortune',
  'Mr Worldwide', 'Chew Barker', 'Greyt Expectations', 'Salty Biscuit', 'Pawblo Escobark',
  'Lord of the Leashes', 'Sir Licks-A-Lot', 'No Bones About It', 'Chair Sniffer', 'Bark Twain',
  'Couch Rocket', 'Tailspin City', 'Notorious D.O.G.', 'Walk of Shamehound', 'Shake\'n\'Bacon',
  'Zoom and Gloom', 'Bite Me Maybe', 'Sofa So Fast', 'Yeet Street', 'Collieflower Power'
]

// More creative and realistic harness names based on real examples
const harnessNames = [
  // Strength/power themed
  'Power Puller', 'Strong Strider', 'Mighty Mover', 'Force Forward', 'Energy Express',
  'Vigor Voyager', 'Momentum Master', 'Drive Dynamo', 'Pull Power', 'Tug Titan',
  'Haul Hero', 'Lift Legend', 'Drag Dragon', 'Yank Yeti', 'Tow Tiger',
  'Muscle Master', 'Traction Titan', 'Pull Paladin', 'Haul Hercules', 'Tug Thunder',
  
  // Transportation themed
  'Steam Engine', 'Diesel Driver', 'Electric Express', 'Bullet Train', 'Rocket Sled',
  'Jet Propulsion', 'Turbo Thrust', 'Nitro Boost', 'Hyper Speed', 'Super Sonic',
  
  // Work/occupation themed
  'Builder Bob', 'Carpenter Carl', 'Electrician Ed', 'Plumber Pete', 'Mechanic Mike',
  'Farmer Fred', 'Rancher Rick', 'Cowboy Cody', 'Sheriff Sam', 'Deputy Dan',
  
  // Mythical/legendary themed
  'Atlas', 'Hercules', 'Samson', 'Goliath', 'Titan', 'Giant', 'Colossus', 'Behemoth',
  'Leviathan', 'Kraken', 'Juggernaut', 'Gargantua', 'Cyclops', 'Minotaur', 'Centaur',
  
  // Nature themed
  'Mountain Mover', 'River Runner', 'Forest Hauler', 'Desert Dragger', 'Ocean Tugger',
  'Glacier Grinder', 'Volcano Vaulter', 'Canyon Crusher', 'Valley Voyager', 'Prairie Puller',
  
  // Space themed
  'Cosmic Hauler', 'Galaxy Glider', 'Stellar Strider', 'Nebula Navigator', 'Comet Chaser',
  'Meteor Mover', 'Asteroid Anchor', 'Planet Puller', 'Star Strider', 'Orbit Operator'
]

// Generate randomized runners based on race category
export function generateRandomizedRunners(raceId: string, categoryId: string, count: number = 6): SimulatedRunner[] {
  const runners: SimulatedRunner[] = []
  
  // Create shuffled arrays to ensure uniqueness
  const shuffledHorseNames = [...horseNames].sort(() => Math.random() - 0.5)
  const shuffledGreyhoundNames = [...greyhoundNames].sort(() => Math.random() - 0.5)
  const shuffledHarnessNames = [...harnessNames].sort(() => Math.random() - 0.5)
  const shuffledHorseJockeys = [...horseJockeyNames].sort(() => Math.random() - 0.5)
  const shuffledHarnessDrivers = [...harnessDriverNames].sort(() => Math.random() - 0.5)
  const shuffledHorseWeights = [...horseWeights].sort(() => Math.random() - 0.5)
  const shuffledGreyhoundTimes = [...greyhoundBestTimes].sort(() => Math.random() - 0.5)
  const shuffledSilkColors = [...silkColors].sort(() => Math.random() - 0.5)
  
  for (let i = 0; i < count; i++) {
    let name = ''
    let weight = ''
    let jockey = ''
    let bestTime = ''
    
    // Select name and attributes based on category
    if (categoryId === '4a2788f8-e825-4d36-9894-efd4baf1cfae') { // Horse
      name = shuffledHorseNames[i % shuffledHorseNames.length]
      weight = shuffledHorseWeights[i % shuffledHorseWeights.length]
      jockey = shuffledHorseJockeys[i % shuffledHorseJockeys.length]
    } else if (categoryId === '9daef0d7-bf3c-4f50-921d-8e818c60fe61') { // Greyhound
      name = shuffledGreyhoundNames[i % shuffledGreyhoundNames.length]
      bestTime = shuffledGreyhoundTimes[i % shuffledGreyhoundTimes.length]
      weight = '' // Greyhounds don't have weight
      jockey = '' // Greyhounds don't have jockeys
    } else if (categoryId === '161d9be2-e909-4326-8c2c-35ed71fb460b') { // Harness
      name = shuffledHarnessNames[i % shuffledHarnessNames.length]
      jockey = shuffledHarnessDrivers[i % shuffledHarnessDrivers.length]
      weight = '' // Harness doesn't have weight
    } else {
      // Default to horse if unknown category
      name = shuffledHorseNames[i % shuffledHorseNames.length]
      weight = shuffledHorseWeights[i % shuffledHorseWeights.length]
      jockey = shuffledHorseJockeys[i % shuffledHorseJockeys.length]
    }
    
    // Assign more realistic starting odds based on runner number and category
    // Favorites (lower numbers) get shorter odds, outsiders (higher numbers) get longer odds
    let baseOdds;
    if (i < 2) {
      // Top 2 favorites: 1.5-2.5 (reduced from 1.5-3.0)
      baseOdds = 1.5 + (Math.random() * 1.0);
    } else if (i < 5) {
      // Positions 3-5: 2.5-5.0 (reduced from 2.5-6.0)
      baseOdds = 2.5 + (Math.random() * 2.5);
    } else {
      // Positions 6+: 5.0-20.0 (reduced from 5.0-50.0)
      baseOdds = 5.0 + (Math.random() * 15.0);
    }
    
    // Add some category-specific adjustments
    if (categoryId === '9daef0d7-bf3c-4f50-921d-8e818c60fe61') { // Greyhound
      // Greyhounds typically have shorter odds
      baseOdds *= 0.8;
    } else if (categoryId === '161d9be2-e909-4326-8c2c-35ed71fb460b') { // Harness
      // Harness typically has longer odds
      baseOdds *= 1.2;
    }
    
    // Ensure minimum odds of 1.10
    const odds = Math.max(1.10, baseOdds);
    
    runners.push({
      id: `runner-${raceId}-${i + 1}`,
      number: i + 1,
      name,
      weight,
      jockey,
      odds: parseFloat(odds.toFixed(2)), // Round to 2 decimal places
      oddsTrend: 'none',
      silkColor: shuffledSilkColors[i % shuffledSilkColors.length],
      bestTime
    })
  }
  
  return runners
}

// Initialize odds simulation for a race
export function initializeOddsSimulation(raceId: string, runners: SimulatedRunner[]) {
  // Only initialize if not already initialized
  if (!simulations.value[raceId]) {
    simulations.value[raceId] = {
      runners: {},
      lastUpdate: 0
    }
    
    // Add runners to simulation
    for (const runner of runners) {
      simulations.value[raceId].runners[runner.id] = { ...runner }
    }
  }
  
  return simulations.value[raceId]
}

// Update odds for a race based on simulation progress
export function updateOdds(
  raceId: string,
  progressByRunner: Record<string, number>,
  order: string[]
) {
  const now = Date.now()
  const simulation = simulations.value[raceId]
  
  // If no simulation exists for this race, return
  if (!simulation) {
    return
  }
  
  // Throttle updates to 200ms intervals to prevent excessive updates
  if (now - simulation.lastUpdate < 200) {
    return
  }
  
  // Update last update time
  simulation.lastUpdate = now
  
  // Update odds for each runner
  for (const runnerId of Object.keys(progressByRunner)) {
    const runner = simulation.runners[runnerId]
    if (!runner) continue
    
    const progress = progressByRunner[runnerId]
    const currentPosition = order.indexOf(runnerId) + 1
    const totalRunners = order.length
    
    // Calculate new odds based on position and progress
    // Leaders get shorter odds, trailers get longer odds
    const positionFactor = currentPosition / totalRunners
    
    // Progress factor (0-1, where 1 is finished)
    const progressFactor = progress
    
    // Base odds calculation
    let newOdds = typeof runner.odds === 'number' ? runner.odds : 2.0 // Default to 2.0 if SP
    
    // Adjust odds based on position and progress
    // If runner is leading and making good progress, shorten odds
    if (positionFactor < 0.3 && progressFactor > 0.5) {
      newOdds = Math.max(1.1, newOdds * 0.98) // Shorten odds slightly
    }
    // If runner is trailing and not making good progress, lengthen odds
    else if (positionFactor > 0.7 && progressFactor < 0.3) {
      newOdds = newOdds * 1.02 // Lengthen odds slightly
    }
    // Otherwise make small random adjustments
    else {
      const randomFactor = 0.995 + (Math.random() * 0.01) // 0.995-1.005
      newOdds = newOdds * randomFactor
    }
    
    // Ensure reasonable odds range
    newOdds = Math.min(100, Math.max(1.1, newOdds))
    
    // Determine odds trend
    let trend: OddsTrend = 'none'
    const originalOdds = typeof runner.odds === 'number' ? runner.odds : 2.0 // Default to 2.0 if SP
    const change = Math.abs(newOdds - originalOdds)
    
    // Only show trend if change is significant (> 0.01)
    if (change > 0.01) {
      trend = newOdds < originalOdds ? 'up' : 'down'
    }
    
    // Update runner with new odds
    const displayOdds = parseFloat(newOdds.toFixed(2))
    simulation.runners[runnerId] = {
      ...runner,
      odds: displayOdds,
      oddsTrend: trend
    }
  }
  
  // No need to trigger reactive update here as Vue will react to individual property changes
  // The individual runner updates above will trigger reactivity automatically
}


// Get simulated runners for a race
export function getSimulatedRunners(raceId: string): SimulatedRunner[] {
  const simulation = simulations.value[raceId]
  if (!simulation) {
    return []
  }
  
  return Object.values(simulation.runners)
}

// Reset simulation for a race
export function resetSimulation(raceId: string) {
  if (simulations.value[raceId]) {
    delete simulations.value[raceId]
  }
}