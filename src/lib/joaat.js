import { t } from '../i18n.js'

// Jenkins one-at-a-time hash, same as GetHashKey / joaat in RedM (input lowercased).
export function joaat(str) {
  const s = String(str).toLowerCase()
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h + s.charCodeAt(i)) >>> 0
    h = (h + ((h << 10) >>> 0)) >>> 0
    h = (h ^ (h >>> 6)) >>> 0
  }
  h = (h + ((h << 3) >>> 0)) >>> 0
  h = (h ^ (h >>> 11)) >>> 0
  h = (h + ((h << 15) >>> 0)) >>> 0
  return h >>> 0
}

export const toHex = (h) => '0x' + h.toString(16).toUpperCase().padStart(8, '0')
export const toSigned = (h) => (h > 0x7fffffff ? h - 0x100000000 : h)

let toastTimer = null
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
  let el = document.getElementById('copy-toast')
  if (!el) {
    el = document.createElement('div')
    el.id = 'copy-toast'
    document.body.appendChild(el)
  }
  el.textContent = t('copied') + (text.length > 60 ? text.slice(0, 60) + '…' : text)
  el.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.classList.remove('show'), 1400)
}
