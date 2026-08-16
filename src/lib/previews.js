// Unified preview-image resolver for every category that can show one.
//
// Three sources, in priority order per category:
//   1. texture categories (cat.image)      -> the row's own `url` field
//   2. model categories (peds/vehicles/...) -> model_images.json index
//   3. item categories (weapons/ammo/...)   -> matched inventory icon texture
//
// Indexes load once, lazily, and are shared by the list, gallery and panel.
import { shallowRef } from 'vue'
import { TEX_BASE } from '../categories.js'

// categories whose entries map to a rendered model screenshot
export const MODEL_CATS = new Set(['peds', 'vehicles', 'objects'])
// categories whose entry names resolve to an inventory icon texture
export const ICON_CATS = new Set(['weapons', 'ammo', 'pickups'])

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

function loadIconIndex() {
  iconPromise ||= fetch(import.meta.env.BASE_URL + 'data/tex_inventory_items.json')
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .then((j) => {
      const m = new Map()
      if (j) {
        const ni = j.fields.indexOf('name')
        const ui = j.fields.indexOf('url')
        for (const r of j.rows) m.set(String(r[ni]).toLowerCase(), r[ui])
      }
      return (iconIndex.value = m)
    })
  return iconPromise
}

// True when this category can show preview images at all.
export function categoryHasPreviews(cat) {
  return !!cat.image || MODEL_CATS.has(cat.id) || ICON_CATS.has(cat.id)
}

// Kick off whatever index this category needs. Safe to call repeatedly.
export function ensurePreviews(catId) {
  if (MODEL_CATS.has(catId)) loadModelIndex()
  else if (ICON_CATS.has(catId)) loadIconIndex()
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
  if (MODEL_CATS.has(catId)) {
    const idx = modelIndex.value
    if (!idx) return null
    const n = String(name).toLowerCase()
    const file = idx[n]
    if (!file) return null
    if (CDN_BASE) {
      const u = CDN_BASE + file
      return { thumb: u, full: u } // no downscaled variant exists on the CDN
    }
    const base = import.meta.env.BASE_URL + 'images/models/'
    return { thumb: base + 'thumbs/' + n + '.jpg', full: base + n + '.jpg' }
  }
  if (ICON_CATS.has(catId)) {
    const hit = lookupIcon(name)
    if (!hit) return null
    const u = TEX_BASE + hit
    return { thumb: u, full: u }
  }
  return null
}
