<script setup>
import { computed, ref, watch, watchEffect } from 'vue'
import { CATEGORY_META, REPO_URL, TEX_BASE } from '../../categories.js'
import { joaat, toHex, toSigned, copyText } from '../../lib/joaat.js'
import { modelImageUrl } from '../../lib/modelImages.js'
import { isBookmarked, toggleBookmark, pushRecent } from '../../lib/storage.js'
import { entryUrl } from '../../lib/router.js'
import { t } from '../../i18n.js'
import Icon from '../common/Icon.vue'
import CodeBlock from '../common/CodeBlock.vue'
import WorldMap from './WorldMap.vue'

const props = defineProps({
  cat: { type: Object, required: true },
  entry: { type: Object, required: true },
  // sibling entries in the same group (groups-kind), for the related section
  siblings: { type: Array, default: () => [] },
})
const emit = defineEmits(['close', 'select'])

const meta = computed(() => CATEGORY_META[props.cat.id] || {})
const name = computed(() => String(props.entry.name ?? props.entry.model ?? Object.values(props.entry)[0]))

const refEntry = computed(() => ({
  cat: props.cat.id,
  name: name.value,
  ...(props.entry.group ? { group: props.entry.group } : {}),
}))

watch(refEntry, (e) => pushRecent(e), { immediate: true })

const starred = computed(() => isBookmarked(refEntry.value))

const hashes = computed(() => {
  const h = joaat(name.value)
  return { hex: toHex(h), uint: h, int: toSigned(h) }
})

const snippet = computed(() => {
  try {
    return meta.value.snippet ? meta.value.snippet(props.entry) : null
  } catch {
    return null
  }
})

const detailFields = computed(() =>
  Object.entries(props.entry).filter(([k]) => k !== 'name' && k !== 'url')
)

// image priority: texture url -> local model preview (peds/vehicles/objects) -> inventory icon
const MODEL_IMG_CATS = new Set(['peds', 'vehicles', 'objects'])
const modelImgFailed = ref(false)
const resolvedIcon = ref(null)
watchEffect(async () => {
  resolvedIcon.value = null
  modelImgFailed.value = false
  // reads name.value so this re-runs per entry
  const n = name.value
  if (props.entry.url || MODEL_IMG_CATS.has(props.cat.id)) return
  resolvedIcon.value = await modelImageUrl(props.cat.id, n)
})
const imageUrl = computed(() => {
  if (props.entry.url) return TEX_BASE + props.entry.url
  if (MODEL_IMG_CATS.has(props.cat.id) && !modelImgFailed.value) {
    return import.meta.env.BASE_URL + 'images/models/' + name.value.toLowerCase() + '.jpg'
  }
  return resolvedIcon.value
})
const photoStyle = computed(() => MODEL_IMG_CATS.has(props.cat.id) && !props.entry.url)

const coords = computed(() => {
  const { x, y } = props.entry
  if (typeof x !== 'number' || typeof y !== 'number') return null
  return { x, y }
})

const related = computed(() =>
  props.siblings.filter((s) => s !== name.value).slice(0, 6)
)

const srcPath = computed(() => props.cat.src || '')
const srcUrl = computed(() => `${REPO_URL}/tree/master/${srcPath.value}`)

function share() {
  const url = location.origin + location.pathname + entryUrl(props.cat.id, refEntry.value)
  copyText(url)
}
</script>

<template>
  <aside class="discovery-panel">
    <div class="panel-head">
      <h2 class="mono" :title="name">{{ name }}</h2>
      <div class="panel-actions">
        <button
          class="icon-btn"
          :class="{ starred }"
          :title="t('bookmarks')"
          @click="toggleBookmark(refEntry)"
        >
          <Icon name="star" :size="14" />
        </button>
        <button class="icon-btn" :title="t('share')" @click="share">
          <Icon name="link" :size="13" />
        </button>
        <button class="icon-btn" :title="t('close')" @click="emit('close')">
          <Icon name="x" :size="14" />
        </button>
      </div>
    </div>

    <div class="panel-badges">
      <span class="badge brass">{{ t('group.' + (meta.group || 'Other')) }}</span>
      <a v-if="srcPath" class="badge" :href="srcUrl" target="_blank" rel="noopener" :title="srcPath">
        <Icon name="external-link" :size="10" /> {{ srcPath.split('/')[0] }}
      </a>
    </div>

    <div v-if="imageUrl" class="panel-section">
      <div class="panel-img" :class="{ photo: photoStyle }">
        <img
          :src="imageUrl"
          :alt="name"
          loading="lazy"
          @error="photoStyle ? (modelImgFailed = true) : (resolvedIcon = null)"
        />
      </div>
    </div>

    <div v-if="coords" class="panel-section">
      <div class="panel-label">{{ t('location') }}</div>
      <WorldMap :x="coords.x" :y="coords.y" :label="name" />
    </div>

    <div v-if="detailFields.length" class="panel-section">
      <div class="panel-label">{{ t('details') }}</div>
      <div class="detail-grid">
        <template v-for="[k, v] in detailFields" :key="k">
          <span class="detail-key">{{ k.replace('_', ' ') }}</span>
          <button class="detail-val mono" :title="t('copy') + ' ' + k" @click="copyText(String(v))">{{ v }}</button>
        </template>
      </div>
    </div>

    <div class="panel-section">
      <div class="panel-label">joaat("{{ name }}")</div>
      <div class="hash-results">
        <button class="chip" @click="copyText(hashes.hex)">{{ hashes.hex }}</button>
        <button class="chip" @click="copyText(String(hashes.uint))">uint: {{ hashes.uint }}</button>
        <button class="chip" @click="copyText(String(hashes.int))">int: {{ hashes.int }}</button>
      </div>
    </div>

    <div v-if="snippet" class="panel-section">
      <div class="panel-label">{{ t('luaExample') }}</div>
      <CodeBlock :code="snippet" lang="lua" />
    </div>

    <div v-if="related.length" class="panel-section">
      <div class="panel-label">{{ t('related') }}</div>
      <div class="related-list">
        <button
          v-for="r in related"
          :key="r"
          class="chip small mono"
          @click="emit('select', { group: entry.group, name: r })"
        >{{ r }}</button>
      </div>
    </div>

    <div class="panel-section">
      <a class="src-link" :href="srcUrl" target="_blank" rel="noopener">{{ t('viewSource') }}</a>
    </div>
  </aside>
</template>

<style>
.discovery-panel {
  width: var(--panel-w);
  flex-shrink: 0;
  border-left: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  padding: var(--sp-5) var(--sp-5);
  position: sticky;
  top: var(--topbar-h);
  height: calc(100vh - var(--topbar-h));
  overflow-y: auto;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
}
.panel-head h2 { font-size: var(--fs-md); overflow-wrap: anywhere; font-weight: 650; }
.panel-actions { display: flex; gap: var(--sp-1); flex-shrink: 0; }

.panel-badges { display: flex; gap: var(--sp-2); margin-bottom: var(--sp-4); flex-wrap: wrap; }
.panel-badges a.badge:hover { text-decoration: none; border-color: var(--text-muted); }

.panel-section { margin-bottom: var(--sp-5); }

.panel-img {
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-4);
}
.panel-img.photo { padding: 0; background: var(--code-bg); }
.panel-img img { max-width: 100%; max-height: 240px; object-fit: contain; }
.panel-img.photo img { width: 100%; max-height: 260px; object-fit: cover; }

.detail-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 3px var(--sp-3);
  align-items: center;
}
.detail-key { font-size: var(--fs-sm); color: var(--text-muted); }
.detail-val {
  background: none;
  border: none;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  text-align: left;
  cursor: pointer;
  padding: 2px var(--sp-1);
  border-radius: var(--radius-sm);
  overflow-wrap: anywhere;
}
.detail-val:hover { background: var(--surface-hover); }

.hash-results { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
.related-list { display: flex; flex-wrap: wrap; gap: var(--sp-1); }
.src-link { font-size: var(--fs-sm); }

@media (max-width: 1100px) {
  .discovery-panel {
    position: fixed;
    right: 0;
    top: var(--topbar-h);
    width: min(var(--panel-w), 92vw);
    box-shadow: var(--shadow-panel);
    z-index: var(--z-panel);
  }
}
</style>
