<script setup>
import { computed } from 'vue'
import { effectiveTheme } from '../../theme.js'

// public/images/rdr2map.jpg is the Rockstar map tile pyramid stitched at zoom 4
// (11x9 tiles = 2816x2304). Game coords map onto it via Jean Ropke's constants
// (jeanropke/RDR2CollectorsMap map.js: lat = 0.01552*y - 63.6, lng = 0.01552*x + 111.29,
// map space 176 x 144 latlng units), which gives these fractions of the image:
const props = defineProps({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  label: { type: String, default: '' },
})

// rdr2map_dark.jpg = same pyramid, Jean Ropke's darkmode tile set
const mapUrl = computed(() =>
  import.meta.env.BASE_URL +
  (effectiveTheme.value === 'dark' ? 'images/rdr2map_dark.jpg' : 'images/rdr2map.jpg')
)

const pos = computed(() => {
  const fx = (0.01552 * props.x + 111.29) / 176
  const fy = (63.6 - 0.01552 * props.y) / 144
  return {
    left: (fx * 100).toFixed(2) + '%',
    top: (fy * 100).toFixed(2) + '%',
    inBounds: fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1,
  }
})
</script>

<template>
  <div class="world-map">
    <img :src="mapUrl" alt="RDR2 world map" loading="lazy" />
    <span
      v-if="pos.inBounds"
      class="map-pin"
      :style="{ left: pos.left, top: pos.top }"
      :title="label"
    ></span>
    <div class="map-coords mono">{{ x.toFixed(1) }}, {{ y.toFixed(1) }}</div>
  </div>
</template>

<style>
.world-map {
  position: relative;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  overflow: hidden;
  line-height: 0;
}
.world-map img {
  width: 100%;
  display: block;
}
.map-pin {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent-primary);
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.35);
  transform: translate(-50%, -50%);
}
.map-coords {
  position: absolute;
  right: 6px;
  bottom: 6px;
  font-size: 10px;
  line-height: 1.4;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
}
</style>
