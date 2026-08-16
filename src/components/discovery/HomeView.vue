<script setup>
import { ref, computed, onMounted } from 'vue'
import { CATEGORY_META } from '../../categories.js'
import { joaat, toHex, toSigned, copyText } from '../../lib/joaat.js'
import { t, catDesc, catTitle } from '../../i18n.js'
import { recents } from '../../lib/storage.js'
import { entryUrl, searchUrl } from '../../lib/router.js'
import Icon from '../common/Icon.vue'

const props = defineProps({ manifest: { type: Array, required: true } })
defineEmits(['open-palette'])

const total = computed(() => props.manifest.reduce((a, c) => a + c.count, 0))
const textureCount = computed(() =>
  props.manifest.filter((c) => c.image).reduce((a, c) => a + c.count, 0)
)
const modelImageCount = ref(0)
onMounted(async () => {
  try {
    const res = await fetch(import.meta.env.BASE_URL + 'data/model_images.json')
    if (res.ok) modelImageCount.value = Object.keys(await res.json()).length
  } catch { /* index not generated yet — stat simply hidden */ }
})

const fmt = (n) => n.toLocaleString('en-US')

const hashInput = ref('')
const hashResult = computed(() => {
  const s = hashInput.value.trim()
  if (!s) return null
  const h = joaat(s)
  return { hex: toHex(h), uint: h, int: toSigned(h) }
})
</script>

<template>
  <div class="home">
    <section class="hero">
      <h1 class="hero-title">RDR3 Discoveries</h1>
      <p class="hero-tagline">
        <template v-for="(line, i) in t('heroTagline').split('\n')" :key="i">
          {{ line }}<br v-if="i === 0" />
        </template>
      </p>

      <a class="hero-search" :href="searchUrl('')">
        <Icon name="search" :size="15" />
        <span>{{ t('searchBig', { n: fmt(total) }) }}</span>
        <kbd>Ctrl K</kbd>
      </a>

      <div class="hero-stats">
        <div class="stat"><strong>{{ fmt(total) }}</strong><span>{{ t('statEntries') }}</span></div>
        <div class="stat"><strong>{{ manifest.length }}</strong><span>{{ t('statCategories') }}</span></div>
        <div class="stat">
          <strong>{{ fmt(textureCount + modelImageCount) }}</strong><span>{{ t('statImages') }}</span>
        </div>
      </div>
    </section>

    <section v-if="recents.length" class="home-section">
      <div class="panel-label">{{ t('recentlyViewed') }}</div>
      <div class="recent-list">
        <a
          v-for="r in recents.slice(0, 8)"
          :key="r.cat + (r.group || '') + r.name"
          class="chip small mono"
          :href="entryUrl(r.cat, r)"
        >
          <Icon :name="CATEGORY_META[r.cat]?.icon || 'box'" :size="11" />
          {{ r.name }}
        </a>
      </div>
    </section>

    <section class="hash-tool">
      <h2>{{ t('hashCalc') }}</h2>
      <input
        v-model="hashInput"
        class="search-input"
        type="text"
        :placeholder="t('hashPlaceholder')"
        spellcheck="false"
      />
      <div v-if="hashResult" class="hash-results">
        <button class="chip" @click="copyText(hashResult.hex)" :title="t('copy')">{{ hashResult.hex }}</button>
        <button class="chip" @click="copyText(String(hashResult.uint))" :title="t('copy')">uint: {{ hashResult.uint }}</button>
        <button class="chip" @click="copyText(String(hashResult.int))" :title="t('copy')">int: {{ hashResult.int }}</button>
      </div>
    </section>

    <section class="home-section">
      <div class="panel-label">{{ t('quickAccess') }}</div>
      <div class="card-grid">
        <a v-for="c in manifest" :key="c.id" :href="'#/c/' + c.id" class="cat-card">
          <div class="cat-card-head">
            <Icon class="cat-icon" :name="CATEGORY_META[c.id]?.icon || 'box'" :size="15" />
            <span>{{ catTitle(c) }}</span>
          </div>
          <p class="cat-desc">{{ catDesc(CATEGORY_META[c.id]) }}</p>
          <div class="cat-count">{{ fmt(c.count) }} {{ t('entries') }}<span v-if="c.groupCount"> · {{ fmt(c.groupCount) }} {{ t('groups') }}</span></div>
        </a>
      </div>
    </section>
  </div>
</template>

<style>
.home { max-width: 1080px; margin: 0 auto; padding: var(--sp-10) var(--sp-8) var(--sp-16); }

.hero-title {
  font-family: var(--font-logo);
  font-size: var(--fs-hero);
  font-weight: 700;
  letter-spacing: 0.01em;
}
.hero-tagline { color: var(--text-secondary); margin-top: var(--sp-2); max-width: 62ch; }

.hero-search {
  margin-top: var(--sp-5);
  width: min(560px, 100%);
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  background: var(--surface-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  color: var(--text-muted);
  padding: var(--sp-3) var(--sp-4);
  font-size: var(--fs-md);
  cursor: pointer;
  transition: border-color var(--dur-fast);
}
.hero-search:hover { border-color: var(--accent-primary); }
.hero-search span { flex: 1; text-align: left; }

.hero-stats { display: flex; gap: var(--sp-6); margin: var(--sp-6) 0 var(--sp-1); flex-wrap: wrap; }
.stat strong {
  display: block;
  font-size: 19px;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}
.stat span { font-size: var(--fs-sm); color: var(--text-muted); }

.home-section { margin-top: var(--sp-8); }
.recent-list { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
.recent-list .chip { display: inline-flex; align-items: center; gap: 5px; }
.recent-list .chip:hover { text-decoration: none; }

.hash-tool {
  margin-top: var(--sp-8);
  padding: var(--sp-4) var(--sp-5);
  background: var(--surface-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
}
.hash-tool h2 { font-size: var(--fs-base); font-weight: 600; margin-bottom: var(--sp-2); }
.hash-tool .hash-results { display: flex; flex-wrap: wrap; gap: var(--sp-2); margin-top: var(--sp-2); }

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: var(--sp-3);
}
.cat-card {
  background: var(--surface-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--sp-3) var(--sp-4);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  transition: border-color var(--dur-fast);
}
.cat-card:hover { border-color: var(--text-muted); text-decoration: none; }
.cat-card-head { font-weight: 600; font-size: 13.5px; display: flex; align-items: center; gap: var(--sp-2); }
.cat-card .cat-desc { font-size: var(--fs-sm); color: var(--text-muted); flex: 1; }
.cat-count {
  font-size: var(--fs-sm);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 720px) {
  .home { padding: var(--sp-6) var(--sp-4); }
}
</style>
