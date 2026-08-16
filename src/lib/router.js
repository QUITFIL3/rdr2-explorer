// Minimal hash router with query-string state so search/filter/selection
// are shareable and survive back/forward.
//   #/                      home
//   #/bookmarks             bookmarks page
//   #/c/<id>?q=..&f_x=..&sel=..&selg=..   category explorer state
export function parseHash() {
  const h = location.hash.slice(1) || '/'
  const qi = h.indexOf('?')
  const path = qi >= 0 ? h.slice(0, qi) : h
  const query = new URLSearchParams(qi >= 0 ? h.slice(qi + 1) : '')
  const m = path.match(/^\/c\/([\w-]+)/)
  if (m) return { page: 'cat', id: m[1], query }
  if (path === '/bookmarks') return { page: 'bookmarks', id: null, query }
  if (path === '/credits') return { page: 'credits', id: null, query }
  if (path === '/search') return { page: 'search', id: null, query }
  if (path === '/ai') return { page: 'ai', id: null, query }
  return { page: 'home', id: null, query }
}

// Replace the current URL's query state without adding a history entry
// (and without firing hashchange, so in-page state is not re-applied).
export function replaceQuery(params) {
  const h = location.hash.slice(1) || '/'
  const qi = h.indexOf('?')
  const path = qi >= 0 ? h.slice(0, qi) : h
  const qs = params.toString()
  history.replaceState(null, '', '#' + path + (qs ? '?' + qs : ''))
}

export function searchUrl(text) {
  const p = new URLSearchParams()
  if (text) p.set('q', text)
  const qs = p.toString()
  return '#/search' + (qs ? '?' + qs : '')
}

export function entryUrl(catId, entry) {
  const p = new URLSearchParams()
  p.set('sel', entry.name)
  if (entry.group) p.set('selg', entry.group)
  return `#/c/${catId}?${p.toString()}`
}
