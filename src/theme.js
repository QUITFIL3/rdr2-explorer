// Reactive theme store: 'dark' (default) | 'light', persisted.
// Dark is the product's primary look; tokens.css defines dark on bare :root.
import { ref, computed } from 'vue'

export const theme = ref(localStorage.getItem('theme') || 'dark')

export const effectiveTheme = computed(() => theme.value)

export function applyTheme() {
  if (theme.value) document.documentElement.dataset.theme = theme.value
  else delete document.documentElement.dataset.theme
}

export function toggleTheme() {
  theme.value = effectiveTheme.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem('theme', theme.value)
  applyTheme()
}

applyTheme()
