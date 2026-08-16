<script setup>
import { computed } from 'vue'
import { t } from '../../i18n.js'
import Icon from './Icon.vue'

const props = defineProps({
  page: { type: Number, required: true }, // 1-based
  total: { type: Number, required: true }, // total items
  perPage: { type: Number, required: true },
})
const emit = defineEmits(['update:page'])

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.perPage)))

// windowed page numbers with ellipses: 1 … 4 5 [6] 7 8 … 20
const pages = computed(() => {
  const last = pageCount.value
  const cur = props.page
  const out = []
  const push = (n) => out.push(n)
  const window = 2
  let prev = 0
  for (let i = 1; i <= last; i++) {
    const inWindow = i === 1 || i === last || (i >= cur - window && i <= cur + window)
    if (!inWindow) continue
    if (prev && i - prev > 1) push('…')
    push(i)
    prev = i
  }
  return out
})

const first = computed(() => (props.page - 1) * props.perPage + 1)
const last = computed(() => Math.min(props.page * props.perPage, props.total))

function go(p) {
  const next = Math.min(pageCount.value, Math.max(1, p))
  if (next !== props.page) emit('update:page', next)
}
</script>

<template>
  <nav v-if="pageCount > 1" class="pagination" :aria-label="t('pagination')">
    <span class="page-range mono">{{ t('showingRange', { a: first, b: last, n: total }) }}</span>

    <button class="chip small" :disabled="page === 1" :title="t('prevPage')" @click="go(page - 1)">
      <Icon name="chevron-right" :size="11" class="flip" />
    </button>

    <template v-for="(p, i) in pages" :key="i">
      <span v-if="p === '…'" class="page-gap">…</span>
      <button
        v-else
        class="chip small page-btn"
        :class="{ on: p === page }"
        :aria-current="p === page ? 'page' : undefined"
        @click="go(p)"
      >{{ p }}</button>
    </template>

    <button class="chip small" :disabled="page === pageCount" :title="t('nextPage')" @click="go(page + 1)">
      <Icon name="chevron-right" :size="11" />
    </button>
  </nav>
</template>

<style>
.pagination {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--sp-1);
  margin: var(--sp-5) 0 0;
  justify-content: center;
}
.pagination .chip { display: inline-flex; align-items: center; justify-content: center; min-width: 28px; }
.pagination .chip:disabled { opacity: 0.35; cursor: default; }
.pagination .chip:disabled:hover { color: var(--text-secondary); border-color: var(--border-primary); }
.page-range {
  margin-right: auto;
  font-size: var(--fs-sm);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
.page-gap { color: var(--text-muted); padding: 0 2px; }
.flip { transform: rotate(180deg); }

@media (max-width: 720px) {
  .page-range { margin-right: 0; width: 100%; text-align: center; }
}
</style>
