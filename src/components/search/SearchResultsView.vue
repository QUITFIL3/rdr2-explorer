<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { CATEGORY_META } from '../../categories.js'
import { t, catTitle } from '../../i18n.js'
import { copyText } from '../../lib/joaat.js'
import { parseQuery } from '../../lib/searchQuery.js'
import { ensureIndex, searchAll, countByCategory, indexReady, indexProgress } from '../../lib/searchIndex.js'
import { parseHash, replaceQuery, entryUrl } from '../../lib/router.js'
import Icon from '../common/Icon.vue'
import HighlightedText from '../common/HighlightedText.vue'

const props = defineProps({
  manifest: { type: Array, required: true },
  routeTick: { type: Number, default: 0 },
})

const RESULT_LIMIT = 200

const raw = ref('')
const debounced = ref('')
const scope = ref('') // '' = all categories, otherwise a category id
let debounce

watch(raw, (v) => {
  clearTimeout(debounce)
  debounce = setTimeout(() => (debounced.value = v), 250)
})
onUnmounted(() => clearTimeout(debounce))

const categoryIds = computed(() => props.manifest.map((c) => c.id))
const catById = computed(() => Object.fromEntries(props.manifest.map((c) => [c.id, c])))

const query = computed(() => {
  const parsed = parseQuery(debounced.value, categoryIds.value)
  // the scope chips are just a friendlier way to set the same thing as `type:`
  if (!parsed.categoryId && scope.value) parsed.categoryId = scope.value
  return parsed
})

const results = computed(() => {
  if (!indexReady.value && !indexProgress.value) return []
  return searchAll(query.value, {
    perCategory: query.value.categoryId ? Infinity : 8,
    limit: RESULT_LIMIT,
  })
})

// facet counts ignore the active scope so the user can see where else hits live
const facets = computed(() => {
  const counts = countByCategory({ ...query.value, categoryId: null })
  return [...counts.entries()]
    .map(([id, n]) => ({ id, n, title: catById.value[id] ? catTitle(catById.value[id]) : id }))
    .sort((a, b) => b.n - a.n)
})
const totalHits = computed(() => facets.value.reduce((a, f) => a + f.n, 0))

// highlight the free-text part only; a hash query has nothing to underline
const needle = computed(() => query.value.text.trim())

// ---------- URL state ----------
function applyRoute() {
  const { query: q } = parseHash()
  raw.value = q.get('q') || ''
  debounced.value = raw.value
  scope.value = q.get('in') || ''
}
watch([debounced, scope], () => {
  const p = new URLSearchParams()
  if (debounced.value.trim()) p.set('q', debounced.value.trim())
  if (scope.value) p.set('in', scope.value)
  replaceQuery(p)
})
watch(() => props.routeTick, applyRoute)

const inputEl = ref(null)
onMounted(() => {
  applyRoute()
  ensureIndex(props.manifest)
  inputEl.value?.focus()
})
watch(() => props.manifest, (m) => ensureIndex(m))

const EXAMPLES = ['WEAPON_REVOLVER_CATTLEMAN', 'WORLD_HUMAN_SMOKE', 'a_c_horse_arabian_white', '0x169F59F7']
function useExample(x) {
  raw.value = x
  debounced.value = x
}
function clearAll() {
  raw.value = ''
  debounced.value = ''
  scope.value = ''
}
</script>

<template>
  <div class="search-view">
    <header class="search-head">
      <h1 class="search-title">{{ t('searchTitle') }}</h1>
      <div class="search-box">
        <Icon name="search" :size="16" />
        <input
          ref="inputEl"
          v-model="raw"
          class="search-box-input"
          type="search"
          :placeholder="t('searchEverything')"
          :aria-label="t('searchEverything')"
          spellcheck="false"
        />
        <button v-if="raw" class="icon-btn" :title="t('clearAll')" @click="clearAll">
          <Icon name="x" :size="13" />
        </button>
      </div>
      <p class="search-hint">{{ t('searchPrefixHint') }}</p>
    </header>

    <!-- nothing typed yet: show how to start rather than an empty page -->
    <section v-if="!needle && !query.hash" class="search-idle">
      <div class="panel-label">{{ t('tryExamples') }}</div>
      <div class="filter-chips">
        <button v-for="x in EXAMPLES" :key="x" class="chip small mono" @click="useExample(x)">{{ x }}</button>
      </div>
    </section>

    <template v-else>
      <div class="search-meta">
        <span class="result-count mono">{{ t('results', { n: totalHits.toLocaleString('en-US') }) }}</span>
        <span v-if="!indexReady" class="indexing-note">
          {{ t('indexing', { p: Math.round(indexProgress * 100) }) }}
        </span>
      </div>

      <div v-if="facets.length" class="filter-chips scope-row">
        <button class="chip small" :class="{ on: !scope }" @click="scope = ''">
          {{ t('scopeAll') }} <span class="scope-n">{{ totalHits.toLocaleString('en-US') }}</span>
        </button>
        <button
          v-for="f in facets"
          :key="f.id"
          class="chip small"
          :class="{ on: scope === f.id }"
          @click="scope = scope === f.id ? '' : f.id"
        >
          {{ f.title }} <span class="scope-n">{{ f.n.toLocaleString('en-US') }}</span>
        </button>
      </div>

      <div v-if="results.length" class="row-list">
        <a
          v-for="(r, i) in results"
          :key="r.c + (r.g || '') + r.n + i"
          class="row search-row"
          :href="entryUrl(r.c, { name: r.n, group: r.g })"
        >
          <Icon :name="CATEGORY_META[r.c]?.icon || 'box'" :size="13" class="search-row-ico" />
          <span class="row-name">
            <HighlightedText :text="r.n" :needle="needle" />
          </span>
          <span class="row-meta">
            <span v-if="r.g" class="search-row-group mono" :title="r.g">{{ r.g }}</span>
            <span class="search-row-cat">{{ catById[r.c] ? catTitle(catById[r.c]) : r.c }}</span>
            <button class="chip small accent" :title="t('copyName')" @click.prevent.stop="copyText(r.n)">
              {{ t('copy') }}
            </button>
          </span>
        </a>
      </div>

      <div v-else-if="indexReady" class="state-box">
        <div class="state-title">{{ t('noResultsFor', { q: debounced.trim() }) }}</div>
        <div class="state-hint">
          {{ t('tryTitle') }}
          <ul>
            <li>· {{ t('tryPartial') }}</li>
            <li>· {{ t('tryHash') }}</li>
            <li v-if="scope">· {{ t('trySearchAll') }}</li>
          </ul>
        </div>
        <button v-if="scope" class="btn" @click="scope = ''">{{ t('scopeAll') }}</button>
      </div>

      <p v-if="results.length >= RESULT_LIMIT" class="search-truncated">
        {{ t('showingFirst', { n: RESULT_LIMIT }) }}
      </p>
    </template>
  </div>
</template>

<style>
.search-view { max-width: 900px; margin: 0 auto; padding: var(--sp-8) var(--sp-8) var(--sp-16); }

.search-title {
  font-family: var(--font-logo);
  font-size: var(--fs-xl);
  font-weight: 700;
  margin-bottom: var(--sp-4);
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  background: var(--surface-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--sp-3) var(--sp-4);
  color: var(--text-muted);
  transition: border-color var(--dur-fast);
}
.search-box:focus-within { border-color: var(--accent-primary); }
.search-box-input {
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font: var(--fs-md) var(--font-mono);
}
.search-box-input::placeholder { color: var(--text-muted); }
.search-box .icon-btn { border: none; width: 24px; height: 24px; }

.search-hint { margin-top: var(--sp-2); font-size: var(--fs-sm); color: var(--text-muted); }

.search-idle { margin-top: var(--sp-6); }

.search-meta {
  display: flex;
  align-items: baseline;
  gap: var(--sp-3);
  margin: var(--sp-5) 0 var(--sp-2);
}
.indexing-note { font-size: var(--fs-xs); color: var(--accent-secondary); }

.scope-row { margin-bottom: var(--sp-3); }
.scope-n { color: var(--text-muted); font-variant-numeric: tabular-nums; }
.chip.on .scope-n { color: inherit; opacity: 0.7; }

.search-row { color: var(--text-primary); gap: var(--sp-2); }
.search-row:hover { text-decoration: none; }
.search-row-ico { color: var(--text-muted); flex-shrink: 0; }
.search-row .row-name { flex: 1; }
.search-row-group {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  max-width: 22ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.search-row-cat { font-size: var(--fs-xs); color: var(--text-muted); white-space: nowrap; }

.search-truncated {
  margin-top: var(--sp-3);
  font-size: var(--fs-sm);
  color: var(--text-muted);
  text-align: center;
}

@media (max-width: 720px) {
  .search-view { padding: var(--sp-5) var(--sp-4); }
  .search-row-group { display: none; }
}
</style>
