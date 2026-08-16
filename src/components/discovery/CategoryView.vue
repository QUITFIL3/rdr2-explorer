<script setup>
import { ref, shallowRef, computed, reactive, watch, onMounted } from 'vue'
import { CATEGORY_META, TEX_BASE } from '../../categories.js'
import { copyText } from '../../lib/joaat.js'
import { t, catDesc, catTitle } from '../../i18n.js'
import { density } from '../../lib/storage.js'
import { parseHash, replaceQuery } from '../../lib/router.js'
import { MODEL_IMG_CATS, ensureModelIndex, modelPreviewUrl } from '../../lib/modelPreviews.js'
import Icon from '../common/Icon.vue'
import DiscoveryPanel from './DiscoveryPanel.vue'
import CategoryMap from './CategoryMap.vue'

const props = defineProps({
  cat: { type: Object, required: true },
  // bumped by App when the URL query changes for the same category (palette nav, back/forward)
  routeTick: { type: Number, default: 0 },
})

const meta = CATEGORY_META[props.cat.id] || {}

const loading = ref(true)
const error = ref('')
const data = shallowRef(null)

let rowsLower = []
let groupIndex = [] // [name, members[], nameLower, membersJoinedLower]

const q = ref('')
const dq = ref('')
let debounce
watch(q, (v) => {
  clearTimeout(debounce)
  debounce = setTimeout(() => { dq.value = v; limit.value = 300; glimit.value = 60 }, 200)
})

const facetSel = reactive({})
const facetValues = shallowRef({})
const sortDir = ref('') // '' natural | 'asc' | 'desc'
const limit = ref(300)
const glimit = ref(60)
const expanded = reactive(new Set())
const selected = ref(null)

const fieldIdx = computed(() => {
  const m = {}
  ;(props.cat.fields || []).forEach((f, i) => (m[f] = i))
  return m
})

const hasCoords = (props.cat.fields || []).includes('x') && (props.cat.fields || []).includes('y')
const hasModelImages = MODEL_IMG_CATS.has(props.cat.id)
const hasGallery = !!props.cat.image || hasModelImages
if (hasModelImages) ensureModelIndex()
const viewMode = ref(hasCoords ? 'map' : props.cat.image ? 'gallery' : 'list')

// ---------- URL state ----------
function applyRoute() {
  const { query } = parseHash()
  q.value = query.get('q') || ''
  dq.value = q.value
  for (const f of props.cat.facets || []) {
    facetSel[f] = query.get('f_' + f) || facetSel[f] || ''
  }
  const view = query.get('view')
  if (view && ['list', 'map', 'gallery'].includes(view)) viewMode.value = view
  pendingSel = query.get('sel')
    ? { name: query.get('sel'), group: query.get('selg') || null }
    : null
  applyPendingSelection()
}
let pendingSel = null
let syncing = false

function syncUrl() {
  if (syncing) return
  const p = new URLSearchParams()
  if (dq.value.trim()) p.set('q', dq.value.trim())
  for (const f of props.cat.facets || []) {
    if (facetSel[f]) p.set('f_' + f, facetSel[f])
  }
  if (viewMode.value !== (hasCoords ? 'map' : props.cat.image ? 'gallery' : 'list')) {
    p.set('view', viewMode.value)
  }
  if (selected.value) {
    p.set('sel', String(selected.value.name ?? selected.value[props.cat.fields?.[0]]))
    if (selected.value.group) p.set('selg', selected.value.group)
  }
  replaceQuery(p)
}
watch([dq, facetSel, viewMode, selected], syncUrl)
watch(() => props.routeTick, () => { syncing = true; applyRoute(); syncing = false; syncUrl() })

function applyPendingSelection() {
  if (!pendingSel || !data.value) return
  const sel = pendingSel
  pendingSel = null
  if (data.value.kind === 'rows') {
    const row = data.value.rows.find((r) => String(r[0]) === sel.name)
    if (row) selectRow(row)
  } else if (sel.group && data.value.groups[sel.group]) {
    expanded.add(sel.group)
    selectMember(sel.group, sel.name)
  } else if (data.value.groups[sel.name]) {
    expanded.add(sel.name)
  }
}

// ---------- data loading ----------
async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(import.meta.env.BASE_URL + `data/${props.cat.id}.json`)
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const json = await res.json()
    if (json.kind === 'rows') {
      rowsLower = json.rows.map((r) => r.join(' ').toLowerCase())
      const fv = {}
      for (const f of props.cat.facets || []) {
        const idx = props.cat.fields.indexOf(f)
        const set = new Set()
        for (const r of json.rows) set.add(String(r[idx]))
        fv[f] = [...set].sort()
        facetSel[f] ||= ''
      }
      facetValues.value = fv
    } else {
      groupIndex = Object.entries(json.groups).map(([name, members]) => [
        name, members, name.toLowerCase(), members.join('\n').toLowerCase(),
      ])
    }
    data.value = json
    applyPendingSelection()
  } catch (e) {
    error.value = t('failedData') + e.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  syncing = true
  applyRoute()
  syncing = false
  load()
})

// ---------- filtering / sorting ----------
const filteredRows = computed(() => {
  if (!data.value || data.value.kind !== 'rows') return []
  const query = dq.value.toLowerCase().trim()
  const rows = data.value.rows
  const activeFacets = (props.cat.facets || []).filter((f) => facetSel[f])
  const out = []
  for (let i = 0; i < rows.length; i++) {
    if (query && !rowsLower[i].includes(query)) continue
    let ok = true
    for (const f of activeFacets) {
      if (String(rows[i][fieldIdx.value[f]]) !== facetSel[f]) { ok = false; break }
    }
    if (ok) out.push(rows[i])
  }
  if (sortDir.value) {
    const dir = sortDir.value === 'asc' ? 1 : -1
    out.sort((a, b) => dir * String(a[0]).localeCompare(String(b[0])))
  }
  return out
})

const filteredGroups = computed(() => {
  if (!data.value || data.value.kind !== 'groups') return []
  const query = dq.value.toLowerCase().trim()
  const out = []
  for (const [name, members, nameL, membersL] of groupIndex) {
    if (!query || nameL.includes(query)) {
      out.push({ name, members, partial: false })
    } else if (membersL.includes(query)) {
      out.push({ name, members: members.filter((m) => m.toLowerCase().includes(query)), partial: true })
    }
    if (out.length >= 3000) break
  }
  if (sortDir.value) {
    const dir = sortDir.value === 'asc' ? 1 : -1
    out.sort((a, b) => dir * a.name.localeCompare(b.name))
  }
  return out
})

const shownRows = computed(() => filteredRows.value.slice(0, limit.value))
const shownGroups = computed(() => filteredGroups.value.slice(0, glimit.value))
const totalFiltered = computed(() =>
  data.value?.kind === 'groups'
    ? filteredGroups.value.reduce((a, g) => a + g.members.length, 0)
    : filteredRows.value.length
)

const activeChips = computed(() => {
  const chips = []
  for (const f of props.cat.facets || []) {
    if (facetSel[f]) chips.push({ f, v: facetSel[f] })
  }
  return chips
})
function clearAllFilters() {
  q.value = ''
  dq.value = ''
  for (const f of props.cat.facets || []) facetSel[f] = ''
}

// ---------- selection ----------
function isExpanded(g) {
  return expanded.has(g.name) || (g.partial && g.members.length <= 50)
}
function toggle(g) {
  expanded.has(g.name) ? expanded.delete(g.name) : expanded.add(g.name)
}
function selectRow(row) {
  const obj = {}
  props.cat.fields.forEach((f, i) => (obj[f] = row[i]))
  if (obj.name === undefined) obj.name = row[0]
  selected.value = obj
}
function selectMember(group, name) {
  selected.value = { group, name }
}
function selectRelated(sel) {
  if (sel.group) selectMember(sel.group, sel.name)
}

const siblings = computed(() => {
  if (!selected.value?.group || !data.value || data.value.kind !== 'groups') return []
  return data.value.groups[selected.value.group] || []
})

const mapPoints = computed(() => {
  if (!hasCoords) return []
  const xi = fieldIdx.value.x
  const yi = fieldIdx.value.y
  return filteredRows.value.map((row) => ({ x: row[xi], y: row[yi], name: String(row[0]), row }))
})

const galleryTiles = computed(() =>
  shownRows.value.map((row) => ({
    row,
    name: String(row[0]),
    src: props.cat.image
      ? TEX_BASE + row[fieldIdx.value.url]
      : modelPreviewUrl(String(row[0])), // null when no preview exists -> name-only tile
  }))
)

const fmt = (n) => n.toLocaleString('en-US')
const DENSITIES = ['comfortable', 'compact', 'dense']
function cycleDensity() {
  density.value = DENSITIES[(DENSITIES.indexOf(density.value) + 1) % DENSITIES.length]
}
function cycleSort() {
  sortDir.value = sortDir.value === '' ? 'asc' : sortDir.value === 'asc' ? 'desc' : ''
}
</script>

<template>
  <div class="cat-view" :class="['density-' + density, { 'has-panel': selected }]">
    <div class="cat-main">
      <header class="cat-header">
        <h1><Icon class="cat-icon" :name="meta.icon || 'box'" :size="18" /> {{ catTitle(cat) }}</h1>
        <p class="cat-desc">{{ catDesc(meta) }}</p>
        <div class="cat-stats mono">
          {{ fmt(cat.count) }} {{ t('entries') }}<template v-if="cat.groupCount"> · {{ fmt(cat.groupCount) }} {{ t('groups') }}</template>
        </div>
      </header>

      <div class="toolbar">
        <input
          v-model="q"
          class="search-input"
          type="text"
          :placeholder="t('searchPlaceholder', { n: fmt(cat.count) })"
          spellcheck="false"
        />
        <select
          v-for="f in cat.facets || []"
          :key="f"
          v-model="facetSel[f]"
          class="facet-select"
          :aria-label="f"
        >
          <option value="">{{ t('allFacet', { f: t('facet.' + f.replace('_', ' ')) }) }}</option>
          <option v-for="v in facetValues[f]" :key="v" :value="v">{{ v }}</option>
        </select>

        <span class="result-count">{{ t('results', { n: fmt(totalFiltered) }) }}</span>

        <button class="chip small" :title="t('sortToggle')" @click="cycleSort">
          A–Z {{ sortDir === 'asc' ? '↓' : sortDir === 'desc' ? '↑' : '·' }}
        </button>
        <button class="chip small" :title="t('densityCompact')" @click="cycleDensity">
          <Icon name="list" :size="11" /> {{ t('density' + density[0].toUpperCase() + density.slice(1)) }}
        </button>

        <div v-if="hasCoords || hasGallery" class="view-toggle">
          <button class="chip small" :class="{ on: viewMode === 'list' }" @click="viewMode = 'list'">
            <Icon name="list" :size="12" /> {{ t('viewList') }}
          </button>
          <button
            v-if="hasGallery"
            class="chip small"
            :class="{ on: viewMode === 'gallery' }"
            @click="viewMode = 'gallery'"
          >
            <Icon name="image" :size="12" /> {{ t('viewGallery') }}
          </button>
          <button
            v-if="hasCoords"
            class="chip small"
            :class="{ on: viewMode === 'map' }"
            @click="viewMode = 'map'"
          >
            <Icon name="map" :size="12" /> {{ t('viewMap') }}
          </button>
        </div>
      </div>

      <div v-if="activeChips.length || (dq.trim() && totalFiltered === 0)" class="filter-chips">
        <button v-for="c in activeChips" :key="c.f" class="chip small" @click="facetSel[c.f] = ''">
          {{ c.v }}<span class="x">✕</span>
        </button>
        <button v-if="activeChips.length" class="chip small ghost" @click="clearAllFilters">
          {{ t('clearAll') }}
        </button>
      </div>

      <!-- loading skeleton -->
      <div v-if="loading" class="row-list">
        <div v-for="i in 12" :key="i" class="skeleton-row"></div>
      </div>

      <!-- error -->
      <div v-else-if="error" class="state-box">
        <div class="state-title">{{ error }}</div>
        <button class="btn primary" @click="load">{{ t('retry') }}</button>
      </div>

      <!-- empty -->
      <div v-else-if="totalFiltered === 0" class="state-box">
        <div class="state-title">{{ t('noResultsFor', { q: dq.trim() || '·' }) }}</div>
        <div class="state-hint">
          {{ t('tryTitle') }}
          <ul>
            <li>· {{ t('tryFilters') }}</li>
            <li>· {{ t('tryPartial') }}</li>
            <li>· {{ t('tryHash') }}</li>
          </ul>
        </div>
        <button class="btn" @click="clearAllFilters">{{ t('clearAll') }}</button>
      </div>

      <!-- map view -->
      <CategoryMap
        v-else-if="hasCoords && viewMode === 'map'"
        :points="mapPoints"
        :selected="selected"
        @select="(p) => selectRow(p.row)"
      />

      <!-- gallery view -->
      <template v-else-if="hasGallery && viewMode === 'gallery'">
        <div class="gallery">
          <div
            v-for="tile in galleryTiles"
            :key="tile.name + (tile.row[3] || '')"
            class="tile"
            :class="{ selected: selected && String(selected.name ?? selected[cat.fields[0]]) === tile.name, 'no-img': !tile.src }"
            @click="selectRow(tile.row)"
          >
            <div v-if="tile.src" class="tile-img" :class="{ photo: hasModelImages }">
              <img :src="tile.src" :alt="tile.name" loading="lazy" @error="$event.target.closest('.tile').classList.add('no-img')" />
            </div>
            <div class="tile-foot">
              <span class="tile-name mono" :title="tile.name">{{ tile.name }}</span>
              <button class="chip small accent" :title="t('copyName')" @click.stop="copyText(tile.name)">{{ t('copy') }}</button>
            </div>
          </div>
        </div>
        <button v-if="filteredRows.length > limit" class="show-more btn" @click="limit += 400">
          {{ t('showMore', { n: fmt(filteredRows.length - limit) }) }}
        </button>
      </template>

      <!-- rows list -->
      <template v-else-if="data.kind === 'rows'">
        <div class="row-list">
          <div
            v-for="(row, i) in shownRows"
            :key="i"
            class="row"
            :class="{ selected: selected && selected[cat.fields[0]] === row[0] }"
            @click="selectRow(row)"
          >
            <span class="row-name">{{ row[0] }}</span>
            <span class="row-meta">
              <template v-for="(f, j) in cat.fields" :key="f">
                <button
                  v-if="j > 0 && row[j] !== '' && row[j] !== undefined && f !== 'url'"
                  class="chip small"
                  :title="t('copy') + ' ' + f"
                  @click.stop="copyText(String(row[j]))"
                >{{ f === 'hash' || f === 'doorhash' ? row[j] : f + ': ' + row[j] }}</button>
              </template>
              <button class="chip small accent" :title="t('copyName')" @click.stop="copyText(String(row[0]))">{{ t('copy') }}</button>
            </span>
          </div>
        </div>
        <button v-if="filteredRows.length > limit" class="show-more btn" @click="limit += 500">
          {{ t('showMore', { n: fmt(filteredRows.length - limit) }) }}
        </button>
      </template>

      <!-- groups -->
      <template v-else>
        <div class="group-list">
          <div v-for="g in shownGroups" :key="g.name" class="group">
            <div class="group-head" @click="toggle(g)">
              <Icon name="chevron-right" :size="12" class="caret" :class="{ open: isExpanded(g) }" />
              <span class="row-name">{{ g.name }}</span>
              <span class="row-meta">
                <span class="chip small ghost">{{ t('memberCount', { n: g.members.length, label: cat.itemLabel || 'item' }) }}</span>
                <button class="chip small accent" :title="t('copyName')" @click.stop="copyText(g.name)">{{ t('copy') }}</button>
              </span>
            </div>
            <div v-if="isExpanded(g)" class="group-members">
              <div
                v-for="m in g.members"
                :key="m"
                class="row member"
                :class="{ selected: selected && selected.name === m && selected.group === g.name }"
                @click="selectMember(g.name, m)"
              >
                <span class="row-name">{{ m }}</span>
                <button class="chip small accent" :title="t('copyName')" @click.stop="copyText(m)">{{ t('copy') }}</button>
              </div>
            </div>
          </div>
        </div>
        <button v-if="filteredGroups.length > glimit" class="show-more btn" @click="glimit += 100">
          {{ t('showMoreGroups', { n: fmt(filteredGroups.length - glimit) }) }}
        </button>
      </template>
    </div>

    <DiscoveryPanel
      v-if="selected"
      :cat="cat"
      :entry="selected"
      :siblings="siblings"
      @close="selected = null"
      @select="selectRelated"
    />
  </div>
</template>

<style>
.cat-view { display: flex; min-height: 100%; }
.cat-main { flex: 1; padding: var(--sp-6) var(--sp-8) var(--sp-16); min-width: 0; }

.cat-header h1 {
  font-size: 19px;
  font-weight: 650;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.cat-icon { flex-shrink: 0; color: var(--accent-primary); }
.cat-header .cat-desc { color: var(--text-secondary); margin: var(--sp-1) 0 0; font-size: var(--fs-base); }
.cat-stats { margin-top: var(--sp-1); font-size: var(--fs-sm); color: var(--text-muted); font-variant-numeric: tabular-nums; }

.toolbar {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-4) 0 var(--sp-3);
  background: var(--bg-primary);
}
.toolbar .chip { display: inline-flex; align-items: center; gap: 4px; }

.result-count {
  font-size: var(--fs-sm);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.view-toggle { display: flex; gap: var(--sp-1); }

.filter-chips { margin-bottom: var(--sp-3); }

/* groups */
.group { border-bottom: 1px solid var(--border-muted); }
.group:last-child { border-bottom: none; }
.group-head {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: 6px var(--sp-3);
  cursor: pointer;
  justify-content: space-between;
}
.group-head:hover { background: var(--surface-hover); }
.group-head .row-name { flex: 1; font-weight: 600; }
.caret { color: var(--text-muted); flex-shrink: 0; transition: transform var(--dur-fast); }
.caret.open { transform: rotate(90deg); }
.group-members { border-top: 1px solid var(--border-muted); }
.row.member { padding-left: var(--sp-8); }

/* gallery */
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--sp-2);
}
.gallery:has(.tile-img.photo) { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
.tile {
  background: var(--surface-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}
.tile:hover { border-color: var(--text-muted); }
.tile.selected { border-color: var(--accent-primary); box-shadow: 0 0 0 1px var(--accent-primary); }
.tile-img {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-2);
}
.tile-img.photo { aspect-ratio: 16 / 9; padding: 0; background: var(--code-bg); }
.tile-img img { max-width: 100%; max-height: 100%; object-fit: contain; }
.tile-img.photo img { width: 100%; height: 100%; object-fit: cover; }
.tile.no-img .tile-img { display: none; }
.tile-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-1);
  padding: var(--sp-1) var(--sp-2);
  border-top: 1px solid var(--border-muted);
}
.tile.no-img .tile-foot { border-top: none; }
.tile-name {
  font-size: var(--fs-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

@media (max-width: 720px) {
  .cat-main { padding: var(--sp-4); }
}
</style>
