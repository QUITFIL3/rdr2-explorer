<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'

// "Arrow Up, Mouse_Scroll_Down" / "A, Dpad_Up" -> visual key caps.
// variant 'xbox' renders controller styling (colored face buttons, D-pad and
// stick pictograms); anything else renders as keyboard caps, with a mouse
// pictogram for mouse inputs.
const props = defineProps({
  keys: { type: String, required: true },
  variant: { type: String, default: 'keyboard' },
})

// keyboard tokens: { label, icon? }
const KB_MAP = {
  'Arrow Up': { label: '↑' },
  'Arrow Down': { label: '↓' },
  'Arrow Left': { label: '←' },
  'Arrow Right': { label: '→' },
  Mouse_Left_Click: { label: 'LMB', icon: 'mouse' },
  Mouse_Right_Click: { label: 'RMB', icon: 'mouse' },
  Mouse_Scroll_Click: { label: 'MMB', icon: 'mouse' },
  Mouse_Scroll_Up: { label: 'Scroll ↑', icon: 'mouse' },
  Mouse_Scroll_Down: { label: 'Scroll ↓', icon: 'mouse' },
  Mouse_Move_X: { label: '↔', icon: 'mouse' },
  Mouse_Move_Y: { label: '↕', icon: 'mouse' },
  Mouse_Button_1: { label: 'M4', icon: 'mouse' },
  Mouse_Button_2: { label: 'M5', icon: 'mouse' },
}

// controller tokens: { label, icon?, cls? }
const XB_MAP = {
  Dpad_Up: { label: '↑', icon: 'dpad' },
  Dpad_Down: { label: '↓', icon: 'dpad' },
  Dpad_Left: { label: '←', icon: 'dpad' },
  Dpad_Right: { label: '→', icon: 'dpad' },
  'LS X': { label: 'LS ↔', icon: 'stick' },
  'LS Y': { label: 'LS ↕', icon: 'stick' },
  'RS X': { label: 'RS ↔', icon: 'stick' },
  'RS Y': { label: 'RS ↕', icon: 'stick' },
  'LS Click': { label: 'L3', icon: 'stick' },
  'RS Click': { label: 'R3', icon: 'stick' },
}

const caps = computed(() =>
  String(props.keys)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((tok) => {
      if (tok === 'NO_MAPPING' || tok.includes('UNUSED')) {
        return { label: '—', cls: 'muted', title: tok }
      }
      if (props.variant === 'xbox') {
        if (/^[ABXY]$/.test(tok)) {
          return { label: tok, cls: 'xbtn xbtn-' + tok.toLowerCase(), title: tok }
        }
        const m = XB_MAP[tok]
        return { label: m?.label ?? tok.replace(/_/g, ' '), icon: m?.icon, cls: 'pad', title: tok }
      }
      const m = KB_MAP[tok]
      return { label: m?.label ?? tok.replace(/_/g, ' '), icon: m?.icon, cls: '', title: tok }
    })
)
</script>

<template>
  <span class="keycaps">
    <kbd v-for="(c, i) in caps" :key="i" class="cap" :class="c.cls" :title="c.title">
      <Icon v-if="c.icon" :name="c.icon" :size="10" class="cap-ico" />{{ c.label }}
    </kbd>
  </span>
</template>

<style>
.keycaps {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 3px;
  align-items: center;
}
.keycaps .cap {
  font-size: var(--fs-xs);
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.keycaps .cap-ico { flex-shrink: 0; opacity: 0.85; }
.keycaps .cap.muted { color: var(--text-muted); border-style: dashed; }

/* controller inputs: rounded pills */
.keycaps .cap.pad { border-radius: 9px; padding: 0 7px; }

/* xbox face buttons: filled colored circles, white letter reads on both themes */
.keycaps .cap.xbtn {
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  justify-content: center;
  border-radius: 50%;
  border: none;
  color: #fff;
  font-weight: 700;
  line-height: 1;
}
.keycaps .cap.xbtn-a { background: #3ba55c; }
.keycaps .cap.xbtn-b { background: #d83c3e; }
.keycaps .cap.xbtn-x { background: #3b7dd8; }
.keycaps .cap.xbtn-y { background: #d8a03c; }
</style>
