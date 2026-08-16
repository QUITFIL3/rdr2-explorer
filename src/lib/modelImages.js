// Resolves preview images for model-type entries (weapons, ammo, pickups) from
// the locally downloaded inventory icon textures (tex_inventory_items).
// Lookup is by lowercased model name, with progressive tail-stripping so
// character variants ("weapon_melee_knife_dutch") fall back to the base icon.
import { TEX_BASE } from '../categories.js'

let indexPromise = null

async function loadIndex() {
  const res = await fetch(import.meta.env.BASE_URL + 'data/tex_inventory_items.json')
  const j = await res.json()
  const ni = j.fields.indexOf('name')
  const ui = j.fields.indexOf('url')
  const m = new Map()
  for (const r of j.rows) m.set(String(r[ni]).toLowerCase(), r[ui])
  return m
}

// categories whose entry names can resolve to an inventory icon
export const ICON_CATEGORIES = new Set(['weapons', 'ammo', 'pickups'])

export async function modelImageUrl(catId, name) {
  if (!ICON_CATEGORIES.has(catId)) return null
  indexPromise ||= loadIndex()
  const idx = await indexPromise
  let n = String(name).toLowerCase()
  if (n.startsWith('pickup_')) n = n.slice(7)
  if (idx.has(n)) return TEX_BASE + idx.get(n)
  const parts = n.split('_')
  while (parts.length > 2) {
    parts.pop()
    const t = parts.join('_')
    if (idx.has(t)) return TEX_BASE + idx.get(t)
  }
  return null
}
