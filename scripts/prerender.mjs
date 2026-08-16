// Generates crawlable static HTML (dist/c/<id>/index.html) plus a full
// sitemap.xml at deploy time. The SPA uses hash routing, which search engines
// treat as a single page — these pages give every category a real URL with
// real text content (titles, counts, entry names) that crawlers can index,
// each linking back into the app.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const SITE = 'https://quitfil3.github.io/rdr2-explorer/'
const NAME = 'RDR2 EXPLORER'

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function prerender(dist) {
  const manifest = JSON.parse(readFileSync(join(dist, 'data', 'manifest.json'), 'utf8'))
  const fmt = (n) => n.toLocaleString('en-US')

  const style = `<style>
    body{max-width:900px;margin:0 auto;padding:24px;font:15px/1.6 system-ui,sans-serif;background:#0b0d10;color:#e8eaed}
    a{color:#e0503f;text-decoration:none}a:hover{text-decoration:underline}
    h1{font-size:24px}p.d{color:#9aa1ab}
    .open{display:inline-block;margin:12px 0;padding:8px 16px;border:1px solid #e0503f;border-radius:6px}
    ul{columns:2;list-style:none;padding:0;font-family:monospace;font-size:13px}
    @media(min-width:700px){ul{columns:3}}
    nav{margin-top:32px;padding-top:16px;border-top:1px solid #262b33;font-size:13px;color:#737b85;line-height:2}
  </style>`

  for (const cat of manifest) {
    const data = JSON.parse(readFileSync(join(dist, 'data', cat.id + '.json'), 'utf8'))
    const names =
      data.kind === 'rows'
        ? data.rows.slice(0, 200).map((r) => String(r[0]))
        : Object.keys(data.groups).slice(0, 200)
    const desc = `${cat.title} for Red Dead Redemption 2 / RedM — ${fmt(cat.count)} searchable entries with joaat hashes and ready-to-paste Lua examples.`
    const items = names
      .map((n) => `<li><a href="../../#/c/${cat.id}?sel=${encodeURIComponent(n)}">${esc(n)}</a></li>`)
      .join('\n')
    const others = manifest
      .filter((c) => c.id !== cat.id)
      .map((c) => `<a href="../${c.id}/">${esc(c.title)}</a>`)
      .join(' · ')

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(cat.title)} — RDR2 / RedM — ${NAME}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}c/${cat.id}/">
<link rel="icon" type="image/png" href="../../brand/favicon.png">
${style}
</head>
<body>
<h1>${esc(cat.title)}</h1>
<p class="d">${esc(desc)}</p>
<a class="open" href="../../#/c/${cat.id}">Open in ${NAME} — search, filter &amp; Lua snippets →</a>
<h2>Entries${cat.count > names.length ? ` (first ${names.length} of ${fmt(cat.count)})` : ''}</h2>
<ul>
${items}
</ul>
<nav>
<a href="../../">${NAME} home</a> · ${others}
<div>Data: <a href="https://github.com/femga/rdr3_discoveries" rel="noopener">femga/rdr3_discoveries</a> · Built by Hexa Development</div>
</nav>
</body>
</html>`

    mkdirSync(join(dist, 'c', cat.id), { recursive: true })
    writeFileSync(join(dist, 'c', cat.id, 'index.html'), html)
  }

  const today = new Date().toISOString().slice(0, 10)
  const urls = [SITE, ...manifest.map((c) => `${SITE}c/${c.id}/`)]
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq></url>`
  )
  .join('\n')}
</urlset>
`
  writeFileSync(join(dist, 'sitemap.xml'), sitemap)
  console.log(`prerendered ${manifest.length} category pages + sitemap (${urls.length} urls)`)
}
