import { createI18n } from 'vue-i18n'

// Define the message structure
type MessageSchema = typeof en

// English translations
const en = {
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
    next: 'Next',
    liveUpdates: 'Live Race Updates'
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
    meetings: 'Meetings',
    nextFiveShort: 'Races',
    meetingsShort: 'Meetings',
    toggle: 'Toggle between races and meetings view'
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

// Spanish translations
const es = {
  app: {
    title: 'RaceHub - Panel de Carreras Avanzado',
    footer: 'Datos de carreras proporcionados por Neds API'
  },
  races: {
    noRaces: 'No hay carreras disponibles',
    checkBack: 'Por favor, vuelva más tarde',
    error: 'Error al cargar carreras',
    tryAgain: 'Intentar de nuevo',
    live: 'EN VIVO',
    startingSoon: 'Comienza pronto',
    inProgress: 'En progreso',
    searchPlaceholder: 'Buscar reuniones, carreras o corredores...',
    allTimes: 'Todo el tiempo',
    nextHour: 'Próxima hora',
    next2Hours: 'Próximas 2 horas',
    next4Hours: 'Próximas 4 horas',
    sortBy: 'Ordenar por',
    timeSoonest: 'Tiempo (Más pronto primero)',
    timeLatest: 'Tiempo (Más tarde primero)',
    nameAZ: 'Nombre de la reunión (A-Z)',
    nameZA: 'Nombre de la reunión (Z-A)',
    previous: 'Anterior',
    next: 'Siguiente',
    liveUpdates: 'Actualizaciones de Carreras en Vivo'
  },
  meetings: {
    noMeetings: 'No hay reuniones disponibles',
    error: 'Error al cargar reuniones',
    races: 'carrera | carreras'
  },
  categories: {
    horse: 'Caballo',
    greyhound: 'Galgo',
    harness: 'Arnes',
    selectAll: 'Seleccionar todo'
  },
  views: {
    nextFive: 'Próximas 5 Carreras',
    meetings: 'Reuniones',
    nextFiveShort: 'Carreras',
    meetingsShort: 'Reuniones',
    toggle: 'Alternar entre carreras y reuniones'
  },
  theme: {
    switchToLight: 'Cambiar a modo claro',
    switchToDark: 'Cambiar a modo oscuro',
    highContrast: 'Modo de alto contraste'
  },
  game: {
    toggleOn: 'Juego ACTIVADO',
    toggleOff: 'Juego DESACTIVADO',
    addToBetslip: 'Añadir a la apuesta',
    odds: 'Cuotas',
    placeBet: 'Hacer apuesta',
    at: 'a',
    bestTime: 'Mejor Tiempo'
  },
  accessibility: {
    skipToMain: 'Saltar al contenido principal',
    skipToRaces: 'Saltar a la lista de carreras',
    skipToMeetings: 'Saltar a la vista de reuniones'
  }
}

// French translations
const fr = {
  app: {
    title: 'RaceHub - Tableau de bord de courses avancé',
    footer: 'Données de courses fournies par Neds API'
  },
  races: {
    noRaces: 'Aucune course disponible',
    checkBack: 'Veuillez revenir plus tard',
    error: 'Erreur lors du chargement des courses',
    tryAgain: 'Réessayer',
    live: 'EN DIRECT',
    startingSoon: 'Début imminent',
    inProgress: 'En cours',
    searchPlaceholder: 'Rechercher des réunions, courses ou concurrents...',
    allTimes: 'Tous les horaires',
    nextHour: 'Heure suivante',
    next2Hours: '2 heures suivantes',
    next4Hours: '4 heures suivantes',
    sortBy: 'Trier par',
    timeSoonest: 'Heure (Les plus proches en premier)',
    timeLatest: 'Heure (Les plus tard en premier)',
    nameAZ: 'Nom de la réunion (A-Z)',
    nameZA: 'Nom de la réunion (Z-A)',
    previous: 'Précédent',
    next: 'Suivant',
    liveUpdates: 'Mises à jour des courses en direct'
  },
  meetings: {
    noMeetings: 'Aucune réunion disponible',
    error: 'Erreur lors du chargement des réunions',
    races: 'course | courses'
  },
  categories: {
    horse: 'Cheval',
    greyhound: 'Lévrier',
    harness: 'Attelé',
    selectAll: 'Tout sélectionner'
  },
  views: {
    nextFive: '5 prochaines courses',
    meetings: 'Réunions',
    nextFiveShort: 'Courses',
    meetingsShort: 'Réunions',
    toggle: 'Basculer entre courses et réunions'
  },
  theme: {
    switchToLight: 'Passer en mode clair',
    switchToDark: 'Passer en mode sombre',
    highContrast: 'Mode contraste élevé'
  },
  game: {
    toggleOn: 'Jeu ACTIVÉ',
    toggleOff: 'Jeu DÉSACTIVÉ',
    addToBetslip: 'Ajouter au pari',
    odds: 'Cotes',
    placeBet: 'Placer un pari',
    at: 'à',
    bestTime: 'Meilleur Temps'
  },
  accessibility: {
    skipToMain: 'Aller au contenu principal',
    skipToRaces: 'Aller à la liste des courses',
    skipToMeetings: 'Aller à la vue des réunions'
  }
}

// Create Vue I18n instance
export const i18n = createI18n<[MessageSchema], 'en' | 'es' | 'fr'>({
  legacy: false, // Use Composition API mode
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    es,
    fr
  }
})

export default i18n