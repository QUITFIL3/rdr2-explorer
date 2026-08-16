<script setup>
import { computed } from 'vue'
import { splitMatch } from '../../lib/searchQuery.js'

// Marks the matched span without v-html, so entry names are never interpolated
// as markup.
const props = defineProps({
  text: { type: String, required: true },
  needle: { type: String, default: '' },
})

const parts = computed(() => splitMatch(props.text, props.needle))
</script>

<template>
  <span v-if="parts"
    >{{ parts[0] }}<mark class="hl">{{ parts[1] }}</mark>{{ parts[2] }}</span
  >
  <span v-else>{{ text }}</span>
</template>

<style>
.hl {
  background: none;
  color: var(--accent-primary);
  font-weight: 600;
}
</style>
