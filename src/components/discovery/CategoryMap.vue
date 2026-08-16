<script setup>
import { ref, computed } from 'vue'
import { t } from '../../i18n.js'
import { effectiveTheme } from '../../theme.js'

// Same image + coord mapping as WorldMap.vue (Rockstar tiles stitched at zoom 4;
// constants from jeanropke/RDR2CollectorsMap).
const W = 2816
const H = 2304
const mapUrl = computed(() =>
  import.meta.env.BASE_URL +
  (effectiveTheme.value === 'dark' ? 'images/rdr2map_dark.jpg' : 'images/rdr2map.jpg')
)

const props = defineProps({
  // [{ x, y, name, row }] — game-world coords
  points: { type: Array, required: true },
  // currently selected entry ({ x, y, ... }) for highlighting, or null
  selected: { type: Object, default: null },
})
const emit = defineEmits(['select'])

const px = (x) => ((0.01552 * x + 111.29) / 176) * W
const py = (y) => ((63.6 - 0.01552 * y) / 144) * H

const dots = computed(() =>
  props.points
    .map((p, i) => ({ i, cx: px(p.x), cy: py(p.y), name: p.name }))
    .filter((d) => d.cx >= 0 && d.cx <= W && d.cy >= 0 && d.cy <= H)
)

const selDot = computed(() => {
  if (!props.selected || typeof props.selected.x !== 'number') return null
  return { cx: px(props.selected.x), cy: py(props.selected.y) }
})

// pan/zoom state: content transform = translate(tx,ty) scale(s), origin 0 0
const wrap = ref(null)
const scale = ref(1)
const tx = ref(0)
const ty = ref(0)

// dot radius in SVG user units, kept visually constant while zooming
const dotR = computed(() => 9 / scale.value)

function clampPan() {
  const el = wrap.value
  if (!el) return
  const w = el.clientWidth
  const h = el.clientHeight
  tx.value = Math.min(0, Math.max(w - w * scale.value, tx.value))
  ty.value = Math.min(0, Math.max(h - h * scale.value, ty.value))
}

function onWheel(e) {
  const rect = wrap.value.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const s0 = scale.value
  const s1 = Math.min(14, Math.max(1, s0 * (e.deltaY < 0 ? 1.35 : 1 / 1.35)))
  if (s1 === s0) return
  tx.value = mx - ((mx - tx.value) * s1) / s0
  ty.value = my - ((my - ty.value) * s1) / s0
  scale.value = s1
  clampPan()
}

function resetView() {
  scale.value = 1
  tx.value = 0
  ty.value = 0
}

let dragging = false
let moved = 0
let lx = 0
let ly = 0
let downTarget = null // pointer capture retargets pointerup to the wrap, so remember the real target

function onDown(e) {
  dragging = true
  moved = 0
  lx = e.clientX
  ly = e.clientY
  downTarget = e.target
  wrap.value.setPointerCapture(e.pointerId)
}

const tip = ref({ show: false, x: 0, y: 0, text: '' })

function onMove(e) {
  if (dragging) {
    const dx = e.clientX - lx
    const dy = e.clientY - ly
    moved += Math.abs(dx) + Math.abs(dy)
    tx.value += dx
    ty.value += dy
    lx = e.clientX
    ly = e.clientY
    clampPan()
    tip.value.show = false
    return
  }
  const i = e.target.dataset ? e.target.dataset.i : undefined
  if (i !== undefined) {
    const rect = wrap.value.getBoundingClientRect()
    tip.value = {
      show: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      text: props.points[+i].name,
    }
  } else {
    tip.value.show = false
  }
}

function onUp() {
  dragging = false
  if (moved < 6 && downTarget) {
    const i = downTarget.dataset ? downTarget.dataset.i : undefined
    if (i !== undefined) emit('select', props.points[+i])
  }
  downTarget = null
}

function onLeave() {
  dragging = false
  tip.value.show = false
}
</script>

<template>
  <div class="cat-map">
    <div
      ref="wrap"
      class="cat-map-wrap"
      @wheel.prevent="onWheel"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointerleave="onLeave"
    >
      <div
        class="cat-map-inner"
        :style="{ transform: `translate(${tx}px, ${ty}px) scale(${scale})` }"
      >
        <img :src="mapUrl" alt="RDR2 world map" draggable="false" />
        <svg
          :viewBox="`0 0 ${W} ${H}`"
          preserveAspectRatio="none"
          :style="{ '--dr': dotR }"
        >
          <!-- radius comes from the --dr CSS var so zooming never re-patches
               thousands of circle vnodes (imaps has 8k+ points) -->
          <circle
            v-for="d in dots"
            :key="d.i"
            class="dot"
            :data-i="d.i"
            :cx="d.cx"
            :cy="d.cy"
            r="9"
          />
          <circle
            v-if="selDot"
            class="dot sel"
            :cx="selDot.cx"
            :cy="selDot.cy"
            r="16"
          />
        </svg>
      </div>
      <div
        v-if="tip.show"
        class="cat-map-tip mono"
        :style="{ left: tip.x + 12 + 'px', top: tip.y + 12 + 'px' }"
      >{{ tip.text }}</div>
      <button v-if="scale > 1" class="chip small cat-map-reset" @click.stop="resetView">
        {{ t('resetZoom') }}
      </button>
      <div class="cat-map-count mono">{{ dots.length }}</div>
    </div>
    <div class="cat-map-hint">{{ t('mapHint') }}</div>
  </div>
</template>

<style>
.cat-map-wrap {
  position: relative;
  width: min(100%, calc((100vh - 260px) * 2816 / 2304));
  aspect-ratio: 2816 / 2304;
  margin: 0 auto;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  overflow: hidden;
  cursor: grab;
  touch-action: none;
  user-select: none;
  background: var(--surface-primary);
}
.cat-map-wrap:active { cursor: grabbing; }

.cat-map-inner {
  position: absolute;
  inset: 0;
  transform-origin: 0 0;
}
.cat-map-inner img {
  width: 100%;
  height: 100%;
  display: block;
}
.cat-map-inner svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.cat-map-inner .dot {
  r: calc(var(--dr, 9) * 1px); /* svg geometry via CSS; static r attr is the fallback */
  fill: var(--accent-primary);
  fill-opacity: 0.75;
  stroke: #fff;
  stroke-width: calc(var(--dr, 9) * 0.25px);
  stroke-opacity: 0.6;
  cursor: pointer;
}
.cat-map-inner .dot:hover { fill-opacity: 1; stroke-opacity: 1; }
.cat-map-inner .dot.sel {
  r: calc(var(--dr, 9) * 1.8px);
  fill: #2563eb;
  fill-opacity: 1;
  stroke: #fff;
  stroke-opacity: 1;
  pointer-events: none;
}

.cat-map-tip {
  position: absolute;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: 11px;
  line-height: 1.4;
  padding: 3px 8px;
  border-radius: 5px;
  max-width: 320px;
  overflow-wrap: anywhere;
  z-index: 3;
}

.cat-map-reset {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  background: var(--surface-primary);
}

.cat-map-count {
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 3;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 10.5px;
  padding: 1px 7px;
  border-radius: 4px;
  pointer-events: none;
}

.cat-map-hint {
  margin-top: 8px;
  font-size: 11.5px;
  color: var(--text-muted);
  text-align: center;
}
</style>
