// Unified preview-image resolver.
//
// Every rows-kind category tries three sources in order:
//   1. the row's own `url` field       (texture categories)
//   2. model_images.json               (rendered model screenshots)
//   3. matched icon texture            (item/component names)
//
// Whatever resolves first wins; entries that match nothing show a placeholder.
// Group-kind categories (animations, soundsets, scenarios) have no image source
// in existence, so they never attempt a lookup.
//
// Indexes load once, lazily, and are shared by the list, gallery and panel.
import { shallowRef } from 'vue'
import { TEX_BASE } from '../categories.js'

// categories whose entries are primarily model names (tiles render as photos)
export const MODEL_CATS = new Set(['peds', 'vehicles', 'objects', 'doors', 'markers', 'imaps'])

// deployed builds hotlink the model screenshots (the local set is multi-GB)
const CDN_BASE = import.meta.env.VITE_MODEL_IMG_BASE || ''

const modelIndex = shallowRef(null) // { name: exactRepoFilename }
const iconIndex = shallowRef(null) // Map(lowercased texture name -> url path)

let modelPromise = null
let iconPromise = null

function loadModelIndex() {
  modelPromise ||= fetch(import.meta.env.BASE_URL + 'data/model_images.json')
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
    .then((idx) => (modelIndex.value = idx))
  return modelPromise
}

// Icon sources, most specific first — a weapon should match its inventory icon
// before a same-named menu or HUD sprite.
const ICON_SOURCES = [
  'tex_inventory_items',
  'tex_menu_items',
  'tex_ui_hud',
  'tex_collectors_bag',
  'tex_multiwheel_emotes',
]

function loadIconIndex() {
  iconPromise ||= Promise.all(
    ICON_SOURCES.map((id) =>
      fetch(import.meta.env.BASE_URL + `data/${id}.json`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  ).then((sets) => {
    const m = new Map()
    for (const j of sets) {
      if (!j) continue
      const ni = j.fields.indexOf('name')
      const ui = j.fields.indexOf('url')
      for (const r of j.rows) {
        const k = String(r[ni]).toLowerCase()
        if (!m.has(k)) m.set(k, r[ui]) // earlier source wins
      }
    }
    return (iconIndex.value = m)
  })
  return iconPromise
}

// Group-kind categories (animation dicts, soundsets, scenarios) name behaviours,
// not assets — no image source exists for them anywhere.
export function categoryHasPreviews(cat) {
  return !!cat.image || cat.kind === 'rows'
}

// Kick off the indexes this category needs. Safe to call repeatedly.
export function ensurePreviews(catId) {
  loadModelIndex()
  loadIconIndex()
}

// Item names carry qualifiers the icon set does not ("weapon_melee_knife_dutch"
// -> "weapon_melee_knife"), so strip trailing segments until something matches.
function lookupIcon(name) {
  const idx = iconIndex.value
  if (!idx) return null
  let n = String(name).toLowerCase()
  if (n.startsWith('pickup_')) n = n.slice(7)
  if (idx.has(n)) return idx.get(n)
  const parts = n.split('_')
  while (parts.length > 2) {
    parts.pop()
    const hit = idx.get(parts.join('_'))
    if (hit) return hit
  }
  return null
}

// Resolve preview images for an entry, or null when it has none.
// Returns { thumb, full }: `thumb` is what grids and rows load (a 320px
// downscale for model screenshots, which are up to 2560x1440 originals),
// `full` is what the lightbox opens.
// `textureUrl` is the row's own url field (texture categories only).
export function preview(catId, name, textureUrl) {
  if (textureUrl) {
    const u = TEX_BASE + textureUrl
    return { thumb: u, full: u } // texture art is already tiny
  }
  const n = String(name).toLowerCase()
  const file = modelIndex.value?.[n]
  if (file) {
    if (CDN_BASE) {
      const u = CDN_BASE + file
      return { thumb: u, full: u } // no downscaled variant exists on the CDN
    }
    const base = import.meta.env.BASE_URL + 'images/models/'
    return { thumb: base + 'thumbs/' + n + '.jpg', full: base + n + '.jpg' }
  }
  const hit = lookupIcon(name)
  if (!hit) return null
  const u = TEX_BASE + hit
  return { thumb: u, full: u }
}
