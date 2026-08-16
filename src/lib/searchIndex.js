// Global search index over every category (411k+ names, built lazily).
// Data flows: manifest -> per-category JSON (small files first) -> flat entry
// array searched linearly with ranked matching (exact > prefix > substring).
// Hash strings (0x...) are indexed for rows-categories that carry a hash field.
import { ref } from 'vue'
import { loadCategory } from './dataStore.js'

export const indexReady = ref(false)
export const indexProgress = ref(0) // 0..1

// entry: { n name, l lower, c catId, g group|null, h hash-lower|null }
let entries = []
let startPromise = null

export function ensureIndex(manifest) {
  if (!manifest || !manifest.length) return null // manifest not loaded yet
  startPromise ||= build(manifest)
  return startPromise
}

const yieldUI = () => new Promise((r) => setTimeout(r, 0))
const CHUNK = 20000 // entries appended between yields, keeps the main thread responsive

async function build(manifest) {
  const cats = [...manifest].sort((a, b) => a.count - b.count) // small files first
  const total = manifest.reduce((a, c) => a + c.count, 0) || 1
  let loaded = 0
  for (const c of cats) {
    try {
      const j = await loadCategory(c.id)
      const startLen = entries.length
      const yieldIfDue = async () => {
        if ((entries.length - startLen) % CHUNK !== 0) return
        indexProgress.value = Math.min((loaded + entries.length - startLen) / total, 0.99)
        await yieldUI()
      }
      if (j.kind === 'rows') {
        const hi = j.fields.indexOf('hash')
        for (const r of j.rows) {
          const n = String(r[0])
          entries.push({
            n, l: n.toLowerCase(), c: c.id, g: null,
            h: hi > 0 ? String(r[hi]).toLowerCase() : null,
          })
          if (entries.length % CHUNK === 0) await yieldIfDue()
        }
      } else {
        for (const [gname, members] of Object.entries(j.groups)) {
          entries.push({ n: gname, l: gname.toLowerCase(), c: c.id, g: null, h: null })
          for (const m of members) {
            entries.push({ n: m, l: m.toLowerCase(), c: c.id, g: gname, h: null })
            if (entries.length % CHUNK === 0) await yieldIfDue()
          }
        }
      }
    } catch { /* category failed to load; searchable set is just smaller */ }
    loaded += c.count
    indexProgress.value = loaded / total
    await yieldUI()
  }
  indexReady.value = true
}

// Ranked search. Returns [{ n, c, g, rank }...] grouped-cap per category.
export function searchAll(query, { perCategory = 5, limit = 60 } = {}) {
  const q = query.toLowerCase().trim()
  if (q.length < 2) return []
  const isHash = q.startsWith('0x')
  const matches = []
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]
    let rank = -1
    if (e.l === q) rank = 0
    else if (e.l.startsWith(q)) rank = 1
    else if (e.l.includes(q)) rank = 2
    else if (isHash && e.h && e.h.startsWith(q)) rank = 1
    if (rank < 0) continue
    matches.push({ n: e.n, c: e.c, g: e.g, rank })
    if (matches.length >= 6000) break
  }
  matches.sort((a, b) => a.rank - b.rank || a.n.length - b.n.length)
  const perCat = new Map()
  const out = []
  for (const m of matches) {
    const used = perCat.get(m.c) || 0
    if (used >= perCategory) continue
    perCat.set(m.c, used + 1)
    out.push(m)
    if (out.length >= limit) break
  }
  return out
}
