<script setup>
import { onMounted, onUnmounted } from 'vue'
import Icon from './Icon.vue'
import { copyText } from '../../lib/joaat.js'
import { t } from '../../i18n.js'

const props = defineProps({
  src: { type: String, required: true },
  name: { type: String, default: '' },
})
const emit = defineEmits(['close'])

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}
// return focus where it was so keyboard users don't land at the top of the page
let opener = null
onMounted(() => {
  opener = document.activeElement
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  if (opener instanceof HTMLElement) opener.focus()
})
</script>

<template>
  <Teleport to="body">
    <div class="lightbox" role="dialog" aria-modal="true" :aria-label="name" @click.self="emit('close')">
      <div class="lb-bar">
        <span class="lb-name mono">{{ name }}</span>
        <button class="icon-btn" :title="t('copyName')" @click="copyText(name)">
          <Icon name="copy" :size="14" />
        </button>
        <button class="icon-btn" :title="t('close')" @click="emit('close')">
          <Icon name="x" :size="14" />
        </button>
      </div>
      <img class="lb-img" :src="src" :alt="name" @click.self="emit('close')" />
    </div>
  </Teleport>
</template>

<style>
.lightbox {
  position: fixed;
  inset: 0;
  z-index: var(--z-palette);
  background: var(--backdrop);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-3);
  padding: var(--sp-6);
  cursor: zoom-out;
}
.lb-bar {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: var(--sp-1) var(--sp-2) var(--sp-1) var(--sp-3);
  max-width: 100%;
  cursor: default;
}
.lb-name {
  font-size: var(--fs-base);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lb-img {
  max-width: 100%;
  max-height: calc(100vh - 140px);
  object-fit: contain;
  border-radius: var(--radius-md);
  cursor: default;
}
</style>
