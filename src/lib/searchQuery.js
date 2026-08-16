// Parses the search box into a structured query.
//
// Plain text is the common case; prefixes are an optional power-user layer:
//   cattleman              -> free text
//   type:weapon cattleman  -> free text limited to one category
//   hash:0x169F59F7        -> hash lookup (hex, or decimal signed/unsigned)
//   cat:anims smoke        -> alias of type:
//
// Unknown prefixes are left in the free text so a stray colon never swallows
// what the user typed.
const CATEGORY_PREFIXES = new Set(['type', 'cat', 'category'])
const HASH_PREFIXES = new Set(['hash', 'id'])

/**
 * @param {string} raw text from the search box
 * @param {string[]} [knownCategoryIds] used to resolve `type:` to a real category
 * @returns {{text: string, categoryId: string|null, hash: string|null}}
 */
export function parseQuery(raw, knownCategoryIds = []) {
  const out = { text: '', categoryId: null, hash: null }
  const leftovers = []

  for (const token of String(raw).trim().split(/\s+/)) {
    if (!token) continue
    const colon = token.indexOf(':')
    if (colon <= 0) {
      leftovers.push(token)
      continue
    }
    const key = token.slice(0, colon).toLowerCase()
    const value = token.slice(colon + 1)
    if (!value) {
      leftovers.push(token)
      continue
    }
    if (CATEGORY_PREFIXES.has(key)) {
      const match = resolveCategory(value, knownCategoryIds)
      if (match) out.categoryId = match
      else leftovers.push(token) // unknown category: treat as text, don't hide results
      continue
    }
    if (HASH_PREFIXES.has(key)) {
      out.hash = normalizeHash(value)
      continue
    }
    leftovers.push(token)
  }

  out.text = leftovers.join(' ')
  // a bare hash typed without a prefix still searches hashes
  if (!out.hash && /^(0x[0-9a-f]+|-?\d{4,})$/i.test(out.text)) {
    out.hash = normalizeHash(out.text)
  }
  return out
}

function resolveCategory(value, ids) {
  const v = value.toLowerCase()
  if (ids.includes(v)) return v
  // singular/loose forms: "weapon" -> "weapons", "anim" -> "anims"
  return ids.find((id) => id === v + 's' || id.startsWith(v)) || null
}

/**
 * Accepts 0x-hex, unsigned decimal or signed decimal and returns the canonical
 * lowercase 0x form the index stores, or null when it isn't a hash.
 */
export function normalizeHash(value) {
  const v = String(value).trim()
  if (/^0x[0-9a-f]+$/i.test(v)) {
    return '0x' + v.slice(2).toLowerCase().padStart(8, '0')
  }
  if (/^-?\d+$/.test(v)) {
    let n = Number(v)
    if (!Number.isSafeInteger(n)) return null
    if (n < 0) n += 0x100000000 // signed -> unsigned
    if (n < 0 || n > 0xffffffff) return null
    return '0x' + n.toString(16).padStart(8, '0')
  }
  return null
}

/**
 * Split a string into [before, match, after] for highlighting, or null when the
 * needle isn't present. Case-insensitive, keeps the original casing.
 */
export function splitMatch(text, needle) {
  if (!needle) return null
  const i = text.toLowerCase().indexOf(needle.toLowerCase())
  if (i < 0) return null
  return [text.slice(0, i), text.slice(i, i + needle.length), text.slice(i + needle.length)]
}
