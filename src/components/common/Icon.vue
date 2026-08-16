<script setup>
import { ICONS } from '../../icons.js'
const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 15 },
})
</script>

<template>
  <svg
    class="icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="ICONS[name] || ICONS.box"
  />
</template>

<style>
.icon { display: block; flex-shrink: 0; }
</style>
