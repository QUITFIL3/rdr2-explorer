<script setup>
import { computed, onMounted, ref } from 'vue'
import { t } from '../../i18n.js'
import Icon from '../common/Icon.vue'

const props = defineProps({ manifest: { type: Array, required: true } })

const fmt = (n) => n.toLocaleString('en-US')
const totalEntries = computed(() => props.manifest.reduce((a, c) => a + c.count, 0))
const textureCount = computed(() =>
  props.manifest.filter((c) => c.image).reduce((a, c) => a + c.count, 0)
)
const modelImageCount = ref(0)
onMounted(async () => {
  try {
    const res = await fetch(import.meta.env.BASE_URL + 'data/model_images.json')
    if (res.ok) modelImageCount.value = Object.keys(await res.json()).length
  } catch { /* index missing -> stat stays 0 */ }
})

const SOURCES = [
  {
    name: 'femga/rdr3_discoveries',
    url: 'https://github.com/femga/rdr3_discoveries',
    role: 'sourceGameData',
    license: 'Community research project',
  },
  {
    name: 'BryceCanyonCounty/rdr3-nativedb-data',
    url: 'https://github.com/BryceCanyonCounty/rdr3-nativedb-data',
    role: 'sourceModelImages',
    license: 'GPL-3.0 · powers RedLookup.com',
  },
  {
    name: 'jeanropke/RDR2CollectorsMap',
    url: 'https://github.com/jeanropke/RDR2CollectorsMap',
    role: 'sourceMapCoords',
    license: 'MIT',
  },
  {
    name: 'Rockstar Games',
    url: 'https://www.rockstargames.com/reddeadredemption2',
    role: 'sourceRockstar',
    license: 'All game assets © Rockstar Games',
  },
  {
    name: 'Kanit (Cadson Demak)',
    url: 'https://fonts.google.com/specimen/Kanit',
    role: 'sourceFont',
    license: 'SIL Open Font License 1.1',
  },
]

const TECH = ['Vue 3', 'Vite', 'Feather-style SVG icons', 'GitHub Pages']

const logoUrl = import.meta.env.BASE_URL + 'brand/hexa-logo-clear.png'
</script>

<template>
  <div class="credits">
    <header class="cat-header">
      <h1><Icon class="cat-icon" name="award" :size="18" /> {{ t('credits') }}</h1>
      <p class="cat-desc">{{ t('creditsIntro') }}</p>
    </header>

    <section class="credits-section">
      <div class="panel-label">{{ t('builtBy') }}</div>
      <div class="team-card">
        <img class="team-logo" :src="logoUrl" alt="Hexa Development" loading="lazy" />
        <p class="team-desc">{{ t('teamDesc') }}</p>
        <div class="team-links">
          <a class="chip small" href="https://github.com/hexa-development" target="_blank" rel="noopener">
            <Icon name="github" :size="11" /> hexa-development
          </a>
          <a class="chip small" href="https://github.com/QUITFIL3/rdr3-explorer" target="_blank" rel="noopener">
            <Icon name="github" :size="11" /> QUITFIL3/rdr3-explorer
          </a>
        </div>
      </div>
    </section>

    <section class="credits-section">
      <div class="panel-label">{{ t('dataSources') }}</div>
      <div class="source-list">
        <a
          v-for="s in SOURCES"
          :key="s.name"
          class="source-row"
          :href="s.url"
          target="_blank"
          rel="noopener"
        >
          <div class="source-main">
            <span class="source-name mono">{{ s.name }}</span>
            <Icon name="external-link" :size="11" class="source-ext" />
          </div>
          <div class="source-role">{{ t(s.role) }}</div>
          <div class="source-license">{{ s.license }}</div>
        </a>
      </div>
    </section>

    <section class="credits-section">
      <div class="panel-label">{{ t('inNumbers') }}</div>
      <div class="hero-stats">
        <div class="stat"><strong>{{ fmt(totalEntries) }}</strong><span>{{ t('statEntries') }}</span></div>
        <div class="stat"><strong>{{ manifest.length }}</strong><span>{{ t('statCategories') }}</span></div>
        <div class="stat"><strong>{{ fmt(textureCount) }}</strong><span>{{ t('statTextures') }}</span></div>
        <div class="stat"><strong>{{ fmt(modelImageCount) }}</strong><span>{{ t('statModelShots') }}</span></div>
      </div>
    </section>

    <section class="credits-section">
      <div class="panel-label">{{ t('builtWith') }}</div>
      <div class="filter-chips">
        <span v-for="tech in TECH" :key="tech" class="chip small ghost">{{ tech }}</span>
      </div>
    </section>

    <section class="credits-section">
      <div class="panel-label">{{ t('disclaimer') }}</div>
      <p class="disclaimer-text">{{ t('disclaimerText') }}</p>
    </section>
  </div>
</template>

<style>
.credits { max-width: 860px; margin: 0 auto; padding: var(--sp-6) var(--sp-8) var(--sp-16); }
.credits-section { margin-top: var(--sp-6); }

.team-card {
  background: var(--surface-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--sp-4) var(--sp-5);
}
.team-logo {
  width: 220px;
  max-width: 100%;
  display: block;
}
/* silver-on-transparent artwork — darken so it reads on the light theme */
:root[data-theme='light'] .team-logo { filter: brightness(0.35); }
.team-desc { color: var(--text-secondary); font-size: var(--fs-base); margin-top: var(--sp-1); }
.team-links { display: flex; flex-wrap: wrap; gap: var(--sp-2); margin-top: var(--sp-3); }
.team-links .chip { display: inline-flex; align-items: center; gap: 5px; font-family: var(--font-ui); }
.team-links .chip:hover { text-decoration: none; }

.source-list {
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--surface-primary);
}
.source-row {
  display: block;
  padding: var(--sp-3) var(--sp-4);
  border-bottom: 1px solid var(--border-muted);
  color: var(--text-primary);
}
.source-row:last-child { border-bottom: none; }
.source-row:hover { background: var(--surface-hover); text-decoration: none; }
.source-main { display: flex; align-items: center; gap: var(--sp-2); }
.source-name { font-size: var(--fs-base); font-weight: 600; }
.source-ext { color: var(--text-muted); }
.source-role { font-size: var(--fs-sm); color: var(--text-secondary); margin-top: 2px; }
.source-license { font-size: var(--fs-xs); color: var(--text-muted); margin-top: 2px; }

.disclaimer-text {
  font-size: var(--fs-sm);
  color: var(--text-muted);
  max-width: 70ch;
  line-height: 1.7;
}

@media (max-width: 720px) {
  .credits { padding: var(--sp-5) var(--sp-3) var(--sp-10); }
}
</style>
