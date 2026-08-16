<script setup>
import { computed } from 'vue'

// "Arrow Up, Mouse_Scroll_Down" -> visual key caps
const props = defineProps({ keys: { type: String, required: true } })
const caps = computed(() =>
  String(props.keys)
    .split(',')
    .map((s) => s.trim().replace(/_/g, ' '))
    .filter(Boolean)
)
</script>

<template>
  <span class="keycaps">
    <kbd v-for="(c, i) in caps" :key="i">{{ c }}</kbd>
  </span>
</template>

<style>
.keycaps {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 3px;
  align-items: center;
}
.keycaps kbd { font-size: var(--fs-xs); }
</style>
