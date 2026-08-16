<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { t, catTitle, toggleLocale } from '../../i18n.js'
import { toggleTheme } from '../../theme.js'
import { CATEGORY_META } from '../../categories.js'
import { ensureIndex, searchAll, indexReady, indexProgress } from '../../lib/searchIndex.js'
import { recents, devMode } from '../../lib/storage.js'
import { entryUrl, searchUrl } from '../../lib/router.js'
import { parseQuery } from '../../lib/searchQuery.js'
import Icon from '../common/Icon.vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  manifest: { type: Array, required: true },
})
const emit = defineEmits(['close'])

const q = ref('')
const dq = ref('')
const activeIdx = ref(0)
const inputEl = ref(null)
const listEl = ref(null)

let debounce
watch(q, (v) => {
  clearTimeout(debounce)
  debounce = setTimeout(() => {
    dq.value = v
    activeIdx.value = 0
  }, 120)
})

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    q.value = ''
    dq.value = ''
    activeIdx.value = 0
    ensureIndex(props.manifest)
    await nextTick()
    inputEl.value?.focus()
  }
)
// manifest can arrive after the palette was first opened
watch(
  () => props.manifest,
  (m) => { if (props.open) ensureIndex(m) }
)

const catById = computed(() => Object.fromEntries(props.manifest.map((c) => [c.id, c])))

const commands = computed(() => [
  { type: 'cmd', icon: 'home', label: t('cmdHome'), run: () => (location.hash = '#/') },
  { type: 'cmd', icon: 'star', label: t('cmdBookmarks'), run: () => (location.hash = '#/bookmarks') },
  { type: 'cmd', icon: 'moon', label: t('cmdToggleTheme'), run: toggleTheme },
  { type: 'cmd', icon: 'globe', label: t('cmdToggleLang'), run: toggleLocale },
  { type: 'cmd', icon: 'sliders', label: t('devMode'), run: () => (devMode.value = !devMode.value) },
])

const items = computed(() => {
  const query = dq.value.trim().toLowerCase()
  const out = []
  const cmds = query
    ? commands.value.filter((c) => c.label.toLowerCase().includes(query))
    : commands.value
  out.push(...cmds)
  if (query.length >= 2) {
    const parsed = parseQuery(dq.value.trim(), props.manifest.map((c) => c.id))
    for (const m of searchAll(parsed)) out.push({ type: 'entry', ...m })
    out.push({ type: 'all', label: t('seeAllResults'), href: searchUrl(dq.value.trim()) })
  } else if (!query) {
    for (const r of recents.value.slice(0, 8)) {
      out.push({ type: 'entry', n: r.name, c: r.cat, g: r.group || null, recent: true })
    }
  }
  return out
})

function execute(item) {
  if (!item) return
  if (item.type === 'cmd') item.run()
  else if (item.type === 'all') location.hash = item.href
  else location.hash = entryUrl(item.c, { name: item.n, group: item.g })
  emit('close')
}

function onKey(e) {
  if (e.key === 'Escape') { emit('close'); return }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    const n = items.value.length
    if (!n) return
    activeIdx.value = (activeIdx.value + (e.key === 'ArrowDown' ? 1 : n - 1)) % n
    nextTick(() => {
      listEl.value?.querySelector('.pal-item.active')?.scrollIntoView({ block: 'nearest' })
    })
  } else if (e.key === 'Enter') {
    execute(items.value[activeIdx.value])
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="pal-backdrop" @pointerdown.self="emit('close')">
      <div class="palette" role="dialog" aria-modal="true" @keydown="onKey">
        <div class="pal-input-row">
          <Icon name="search" :size="14" />
          <input
            ref="inputEl"
            v-model="q"
            class="pal-input"
            type="text"
            :placeholder="t('globalSearch')"
            spellcheck="false"
            aria-label="search"
          />
          <div v-if="!indexReady" class="pal-indexing">
            {{ t('indexing', { p: Math.round(indexProgress * 100) }) }}
          </div>
        </div>

        <div ref="listEl" class="pal-list" role="listbox" :aria-label="t('globalSearch')">
          <div
            v-for="(item, i) in items"
            :key="item.type === 'entry' ? item.c + (item.g || '') + item.n + i : item.type + item.label"
            class="pal-item"
            role="option"
            :aria-selected="i === activeIdx"
            :class="{ active: i === activeIdx }"
            @pointermove="activeIdx = i"
            @click="execute(item)"
          >
            <template v-if="item.type === 'all'">
              <Icon name="search" :size="13" class="pal-ico" />
              <span class="pal-name">{{ item.label }}</span>
              <span class="pal-tag"><kbd>Enter</kbd></span>
            </template>
            <template v-else-if="item.type === 'cmd'">
              <Icon :name="item.icon" :size="13" class="pal-ico" />
              <span class="pal-name">{{ item.label }}</span>
              <span class="pal-tag">{{ t('commands') }}</span>
            </template>
            <template v-else>
              <Icon :name="CATEGORY_META[item.c]?.icon || 'box'" :size="13" class="pal-ico" />
              <span class="pal-name mono">{{ item.n }}</span>
              <span v-if="item.g" class="pal-group mono">{{ item.g }}</span>
              <span class="pal-tag">{{ catById[item.c] ? catTitle(catById[item.c]) : item.c }}</span>
            </template>
          </div>
          <div v-if="dq.trim().length >= 2 && items.length === 0" class="state-box">
            <div class="state-title">{{ t('noResultsFor', { q: dq.trim() }) }}</div>
            <div class="state-hint">
              {{ t('tryTitle') }} {{ t('tryPartial') }} · {{ t('tryHash') }}
            </div>
          </div>
          <div v-else-if="dq.trim().length === 1" class="pal-hint-line">{{ t('typeToSearch') }}</div>
        </div>

        <div class="pal-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> {{ t('navigate') }}</span>
          <span><kbd>Enter</kbd> {{ t('open') }}</span>
          <span><kbd>Esc</kbd> {{ t('closeKey') }}</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style>
.pal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--backdrop);
  z-index: var(--z-palette);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 12vh var(--sp-4) 0;
}
.palette {
  width: min(640px, 100%);
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-panel);
  display: flex;
  flex-direction: column;
  max-height: 70vh;
  overflow: hidden;
}
.pal-input-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-4);
  border-bottom: 1px solid var(--border-primary);
  color: var(--text-muted);
}
.pal-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font: var(--fs-md) var(--font-mono);
}
.pal-input::placeholder { color: var(--text-muted); }
.pal-indexing { font-size: var(--fs-xs); white-space: nowrap; color: var(--accent-secondary); }

.pal-list { overflow-y: auto; flex: 1; padding: var(--sp-1) 0; }
.pal-item {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: 6px var(--sp-4);
  cursor: pointer;
  font-size: var(--fs-base);
}
.pal-item.active { background: var(--surface-active); }
.pal-ico { color: var(--text-muted); flex-shrink: 0; }
.pal-item.active .pal-ico { color: var(--accent-primary); }
.pal-name { flex-shrink: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pal-group {
  color: var(--text-muted);
  font-size: var(--fs-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 30%;
}
.pal-tag {
  margin-left: auto;
  flex-shrink: 0;
  font-size: var(--fs-xs);
  color: var(--text-muted);
}
.pal-hint-line { padding: var(--sp-3) var(--sp-4); color: var(--text-muted); font-size: var(--fs-sm); }
.pal-foot {
  display: flex;
  gap: var(--sp-4);
  padding: var(--sp-2) var(--sp-4);
  border-top: 1px solid var(--border-primary);
  color: var(--text-muted);
  font-size: var(--fs-xs);
}
</style>
