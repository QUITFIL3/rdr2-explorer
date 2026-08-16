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

// Ranking, best first. Exact beats prefix beats word-boundary beats substring,
// so searching "cattleman" puts WEAPON_REVOLVER_CATTLEMAN above anything that
// merely contains the word somewhere.
const RANK_EXACT = 0
const RANK_HASH = 1
const RANK_PREFIX = 2
const RANK_WORD = 3
const RANK_SUBSTRING = 4
const SCAN_CAP = 8000 // stop scanning once we clearly have enough to rank

function rankOf(entry, text, hash) {
  if (hash && entry.h === hash) return RANK_HASH
  if (!text) return -1
  const l = entry.l
  if (l === text) return RANK_EXACT
  if (l.startsWith(text)) return RANK_PREFIX
  const at = l.indexOf(text)
  if (at < 0) return -1
  // preceded by a separator counts as a word start ("revolver_CATTLEman")
  return l[at - 1] === '_' || l[at - 1] === ' ' || l[at - 1] === '/' ? RANK_WORD : RANK_SUBSTRING
}

/**
 * Search the whole index.
 * @param {{text: string, categoryId: string|null, hash: string|null}} query parsed query
 * @param {{perCategory?: number, limit?: number}} [opts] perCategory caps how many
 *   hits one category may contribute (use Infinity for a full category listing)
 * @returns {{n: string, c: string, g: string|null, rank: number}[]}
 */
export function searchAll(query, { perCategory = 5, limit = 60 } = {}) {
  const text = (query.text || '').toLowerCase().trim()
  const hash = query.hash || null
  if (!hash && text.length < 2) return []

  const matches = []
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]
    if (query.categoryId && e.c !== query.categoryId) continue
    const rank = rankOf(e, text, hash)
    if (rank < 0) continue
    matches.push({ n: e.n, c: e.c, g: e.g, rank })
    if (matches.length >= SCAN_CAP) break
  }
  matches.sort((a, b) => a.rank - b.rank || a.n.length - b.n.length)

  if (perCategory === Infinity) return matches.slice(0, limit)
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

/** Total hits per category for the given query, for the results-page facets. */
export function countByCategory(query) {
  const text = (query.text || '').toLowerCase().trim()
  const hash = query.hash || null
  const counts = new Map()
  if (!hash && text.length < 2) return counts
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]
    if (rankOf(e, text, hash) < 0) continue
    counts.set(e.c, (counts.get(e.c) || 0) + 1)
  }
  return counts
}
