import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import i18n from './i18n/index.ts'

// Import theme initialization CSS first to prevent FOUC
import './assets/styles/theme-init.css'
import './assets/styles/tailwind.css'

// Add some debugging
// Creating app...

try {
  const app = createApp(App)
  const pinia = createPinia()
  
  app.use(pinia)
  app.use(i18n)
  
  // Mounting app...
  app.mount('#app')
  // App mounted successfully!
} catch (error) {
  // Error creating app: error
}