<script setup>
import { computed } from 'vue'
import { CATEGORY_META, GROUP_ORDER } from '../../categories.js'
import { t, catTitle } from '../../i18n.js'
import { bookmarks, collapsedGroups } from '../../lib/storage.js'
import Icon from '../common/Icon.vue'

const props = defineProps({
  manifest: { type: Array, required: true },
  route: { type: Object, required: true }, // { page, id }
})

const grouped = computed(() => {
  const g = {}
  for (const c of props.manifest) {
    const grp = CATEGORY_META[c.id]?.group || 'Other'
    ;(g[grp] ||= []).push(c)
  }
  const order = [...GROUP_ORDER, ...Object.keys(g).filter((k) => !GROUP_ORDER.includes(k))]
  return order.filter((k) => g[k]).map((k) => ({ name: k, cats: g[k] }))
})

const fmt = (n) => n.toLocaleString('en-US')
const icon = (id) => CATEGORY_META[id]?.icon || 'box'

function toggleGroup(name) {
  collapsedGroups.value = { ...collapsedGroups.value, [name]: !collapsedGroups.value[name] }
}
</script>

<template>
  <aside class="sidebar">
    <nav>
      <div class="nav-group-title static">{{ t('discover') }}</div>
      <a href="#/" class="nav-item" :class="{ active: route.page === 'home' }">
        <span class="nav-icon"><Icon name="home" :size="14" /></span>
        <span class="nav-label">{{ t('overview') }}</span>
      </a>
      <a href="#/search" class="nav-item" :class="{ active: route.page === 'search' }">
        <span class="nav-icon"><Icon name="search" :size="14" /></span>
        <span class="nav-label">{{ t('searchNav') }}</span>
      </a>
      <a href="#/bookmarks" class="nav-item" :class="{ active: route.page === 'bookmarks' }">
        <span class="nav-icon"><Icon name="star" :size="14" /></span>
        <span class="nav-label">{{ t('bookmarks') }}</span>
        <span v-if="bookmarks.length" class="nav-count">{{ bookmarks.length }}</span>
      </a>
      <a href="#/credits" class="nav-item" :class="{ active: route.page === 'credits' }">
        <span class="nav-icon"><Icon name="award" :size="14" /></span>
        <span class="nav-label">{{ t('credits') }}</span>
      </a>

      <div v-for="grp in grouped" :key="grp.name" class="nav-group">
        <button class="nav-group-title" @click="toggleGroup(grp.name)">
          <span>{{ t('group.' + grp.name) }}</span>
          <Icon
            name="chevron-down"
            :size="11"
            class="group-caret"
            :class="{ closed: collapsedGroups[grp.name] }"
          />
        </button>
        <template v-if="!collapsedGroups[grp.name]">
          <a
            v-for="c in grp.cats"
            :key="c.id"
            :href="'#/c/' + c.id"
            class="nav-item"
            :class="{ active: route.page === 'cat' && route.id === c.id }"
          >
            <span class="nav-icon"><Icon :name="icon(c.id)" :size="14" /></span>
            <span class="nav-label">{{ catTitle(c) }}</span>
            <span class="nav-count">{{ fmt(c.count) }}</span>
          </a>
        </template>
      </div>
    </nav>

    <div class="sidebar-footer">
      <div><a href="#/credits">Hexa Development</a></div>
      <div class="credit">{{ t('dataFrom') }} <a href="https://github.com/femga/rdr3_discoveries" target="_blank" rel="noopener">femga/rdr3_discoveries</a></div>
    </div>
  </aside>
</template>

<style>
.sidebar {
  width: var(--sidebar-w);
  flex-shrink: 0;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-primary);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.sidebar nav { flex: 1; padding: var(--sp-2) 0 var(--sp-4); }

.nav-group-title {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--sp-4) var(--sp-4) var(--sp-1);
  font-size: var(--fs-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--text-muted);
}
.nav-group-title:hover { color: var(--text-secondary); }
.nav-group-title.static { cursor: default; }
.group-caret { transition: transform var(--dur-fast); }
.group-caret.closed { transform: rotate(-90deg); }

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-1) var(--sp-4);
  color: var(--text-primary);
  font-size: var(--fs-base);
  border-left: 2px solid transparent;
}
.nav-item:hover { background: var(--surface-hover); text-decoration: none; }
.nav-item.active {
  border-left-color: var(--accent-primary);
  color: var(--accent-primary);
  background: var(--surface-hover);
}
.nav-icon {
  width: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-muted);
}
.nav-item.active .nav-icon { color: var(--accent-primary); }
.nav-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nav-count {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.sidebar-footer {
  padding: var(--sp-3) var(--sp-4);
  border-top: 1px solid var(--border-primary);
  font-size: var(--fs-sm);
  color: var(--text-muted);
}
.sidebar-footer .credit { margin-top: 2px; font-size: var(--fs-xs); }
</style>
