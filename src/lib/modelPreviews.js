// Model preview images (peds / vehicles / objects), driven by the
// public/data/model_images.json index ({ name: exactRepoFilename }).
// Local dev/build serves downloaded files from images/models/<name>.jpg;
// a deployed build sets VITE_MODEL_IMG_BASE to hotlink the source CDN instead
// (the image set is multi-GB and is not published with the site).
import { shallowRef } from 'vue'

export const MODEL_IMG_CATS = new Set(['peds', 'vehicles', 'objects'])

const CDN_BASE = import.meta.env.VITE_MODEL_IMG_BASE || ''

export const modelIndex = shallowRef(null)
let indexPromise = null

export function ensureModelIndex() {
  indexPromise ||= fetch(import.meta.env.BASE_URL + 'data/model_images.json')
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
    .then((idx) => (modelIndex.value = idx))
  return indexPromise
}

// Sync lookup against the loaded index (null while loading / when no image).
export function modelPreviewUrl(name) {
  const idx = modelIndex.value
  if (!idx) return null
  const n = String(name).toLowerCase()
  const file = idx[n]
  if (!file) return null
  return CDN_BASE ? CDN_BASE + file : import.meta.env.BASE_URL + 'images/models/' + n + '.jpg'
}
