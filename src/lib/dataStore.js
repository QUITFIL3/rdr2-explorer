// Single loader for the per-category JSON files.
//
// Both the category explorer and the global search index read the same files;
// without a shared cache the JSON is fetched and parsed twice, and navigating
// back to a category re-parses megabytes for nothing.
//
// Parsed payloads are large (animations alone is ~9.6MB), so the cache is a
// small LRU rather than "keep everything": recent categories stay instant,
// memory stays bounded.
const MAX_CACHED = 3

const cache = new Map() // id -> Promise<json>, iteration order = least recent first
const inFlight = new Map() // id -> Promise, dedupes concurrent callers

function touch(id, promise) {
  cache.delete(id)
  cache.set(id, promise)
  while (cache.size > MAX_CACHED) cache.delete(cache.keys().next().value)
}

export class DataLoadError extends Error {
  constructor(categoryId, cause) {
    super(`Failed to load category "${categoryId}"`)
    this.name = 'DataLoadError'
    this.categoryId = categoryId
    this.cause = cause
  }
}

/**
 * Fetch and parse one category's JSON, reusing an in-flight or cached result.
 * @param {string} id category id from the manifest
 * @param {{signal?: AbortSignal}} [opts]
 * @returns {Promise<object>} the parsed `{ kind, ... }` payload
 */
export function loadCategory(id, { signal } = {}) {
  const cached = cache.get(id)
  if (cached) {
    touch(id, cached)
    return cached
  }
  const existing = inFlight.get(id)
  if (existing) return existing

  const promise = fetch(import.meta.env.BASE_URL + `data/${id}.json`, { signal })
    .then((res) => {
      if (!res.ok) throw new DataLoadError(id, new Error(`HTTP ${res.status}`))
      return res.json()
    })
    .then((json) => {
      inFlight.delete(id)
      touch(id, Promise.resolve(json))
      return json
    })
    .catch((err) => {
      inFlight.delete(id)
      throw err instanceof DataLoadError ? err : new DataLoadError(id, err)
    })

  inFlight.set(id, promise)
  return promise
}

/** Drop a category from the cache (used when a load failed and is retried). */
export function forgetCategory(id) {
  cache.delete(id)
  inFlight.delete(id)
}
