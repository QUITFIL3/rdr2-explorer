<script setup>
import { computed } from 'vue'
import { CATEGORY_META } from '../../categories.js'
import { t, catTitle } from '../../i18n.js'
import { bookmarks, toggleBookmark } from '../../lib/storage.js'
import { entryUrl } from '../../lib/router.js'
import { copyText } from '../../lib/joaat.js'
import Icon from '../common/Icon.vue'

const props = defineProps({ manifest: { type: Array, required: true } })

const catById = computed(() => Object.fromEntries(props.manifest.map((c) => [c.id, c])))

const grouped = computed(() => {
  const g = {}
  for (const b of bookmarks.value) (g[b.cat] ||= []).push(b)
  return Object.entries(g).map(([cat, items]) => ({ cat, items }))
})

// ready-to-paste Lua table; grouped entries keep their dictionary
function copyLua(items) {
  const lines = items.map((b) =>
    b.group ? `  { group = "${b.group}", name = "${b.name}" },` : `  "${b.name}",`
  )
  copyText('{\n' + lines.join('\n') + '\n}')
}
</script>

<template>
  <div class="bookmarks-page">
    <header class="cat-header">
      <h1><Icon class="cat-icon" name="star" :size="18" /> {{ t('bookmarks') }}</h1>
    </header>

    <div v-if="!bookmarks.length" class="state-box">
      <div class="state-title">{{ t('noBookmarks') }}</div>
    </div>

    <div v-for="grp in grouped" :key="grp.cat" class="bm-group">
      <div class="panel-label">
        <span>
          <Icon :name="CATEGORY_META[grp.cat]?.icon || 'box'" :size="12" />
          {{ catById[grp.cat] ? catTitle(catById[grp.cat]) : grp.cat }}
        </span>
        <button class="chip small accent" :title="t('copyLua')" @click="copyLua(grp.items)">
          {{ t('copyLua') }}
        </button>
      </div>
      <div class="row-list">
        <div v-for="b in grp.items" :key="(b.group || '') + b.name" class="row">
          <a class="row-name mono bm-link" :href="entryUrl(b.cat, b)">
            <template v-if="b.group"><span class="bm-dict">{{ b.group }}</span> / </template>{{ b.name }}
          </a>
          <button class="icon-btn starred" :title="t('bookmarks')" @click="toggleBookmark(b)">
            <Icon name="star" :size="13" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.bookmarks-page { max-width: 860px; margin: 0 auto; padding: var(--sp-6) var(--sp-8) var(--sp-16); }
.bm-group { margin-top: var(--sp-5); }
.bm-group .panel-label span { display: inline-flex; align-items: center; gap: var(--sp-1); }
.bm-link { color: var(--text-primary); flex: 1; }
.bm-link:hover { color: var(--accent-primary); text-decoration: none; }
.bm-dict { color: var(--text-muted); }
.bookmarks-page .icon-btn { width: 26px; height: 26px; border: none; }

@media (max-width: 720px) {
  .bookmarks-page { padding: var(--sp-5) var(--sp-3) var(--sp-10); }
}
</style>
