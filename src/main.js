import { createApp } from 'vue'
import App from './App.vue'
import './styles/kanit.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'

createApp(App).mount('#app')

// offline cache — production only, so dev never serves stale modules
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch(() => {})
  })
}
