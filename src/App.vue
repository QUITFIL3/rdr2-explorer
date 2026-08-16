<script setup>
import { ref, onMounted } from 'vue'
import Topbar from './components/navigation/Topbar.vue'
import Sidebar from './components/navigation/Sidebar.vue'
import CommandPalette from './components/navigation/CommandPalette.vue'
import HomeView from './components/discovery/HomeView.vue'
import CategoryView from './components/discovery/CategoryView.vue'
import BookmarksView from './components/discovery/BookmarksView.vue'
import CreditsView from './components/discovery/CreditsView.vue'
import SearchResultsView from './components/search/SearchResultsView.vue'
import { parseHash } from './lib/router.js'
import { t } from './i18n.js'
import { ensureIndex } from './lib/searchIndex.js'

const manifest = ref([])
const loadError = ref('')
const route = ref(parseHash())
// bumped when the URL query changes while staying on the same category
// (command-palette navigation, back/forward) so CategoryView re-applies it
const routeTick = ref(0)

const paletteOpen = ref(false)
function openPalette() {
  paletteOpen.value = true
  if (manifest.value.length) ensureIndex(manifest.value)
}

onMounted(async () => {
  window.addEventListener('hashchange', () => {
    const next = parseHash()
    const samePage = next.page === route.value.page && next.id === route.value.id
    route.value = next
    if (samePage) routeTick.value++
    else document.querySelector('.main')?.scrollTo(0, 0)
  })

  window.addEventListener('keydown', (e) => {
    const inField = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'p')) {
      e.preventDefault()
      paletteOpen.value ? (paletteOpen.value = false) : openPalette()
    } else if (e.key === '/' && !inField && !paletteOpen.value) {
      e.preventDefault()
      openPalette()
    }
  })

  try {
    const res = await fetch(import.meta.env.BASE_URL + 'data/manifest.json')
    if (!res.ok) throw new Error('HTTP ' + res.status)
    manifest.value = await res.json()
  } catch (e) {
    loadError.value = t('failedManifest') + e.message
  }
})

const currentCat = () => manifest.value.find((c) => c.id === route.value.id) || null
const reload = () => location.reload()
</script>

<template>
  <div class="shell">
    <Topbar @open-palette="openPalette" />
    <div class="shell-body">
      <Sidebar :manifest="manifest" :route="route" />
      <main class="main">
        <div v-if="loadError" class="state-box">
          <div class="state-title">{{ loadError }}</div>
          <button class="btn primary" @click="reload">{{ t('retry') }}</button>
        </div>
        <CategoryView
          v-else-if="route.page === 'cat' && currentCat()"
          :key="route.id"
          :cat="currentCat()"
          :route-tick="routeTick"
        />
        <BookmarksView v-else-if="route.page === 'bookmarks'" :manifest="manifest" />
        <CreditsView v-else-if="route.page === 'credits'" :manifest="manifest" />
        <SearchResultsView
          v-else-if="route.page === 'search'"
          :manifest="manifest"
          :route-tick="routeTick"
        />
        <HomeView v-else :manifest="manifest" @open-palette="openPalette" />
      </main>
    </div>
    <CommandPalette :open="paletteOpen" :manifest="manifest" @close="paletteOpen = false" />
  </div>
</template>

<style>
.shell { height: 100vh; display: flex; flex-direction: column; }
.shell-body { flex: 1; display: flex; min-height: 0; }
.main { flex: 1; overflow-y: auto; background: var(--bg-primary); min-width: 0; }

@media (max-width: 720px) {
  .shell-body { flex-direction: column; overflow-y: auto; }
  .sidebar { width: 100%; max-height: 40vh; }
  .main { overflow-y: visible; }
}
</style>
