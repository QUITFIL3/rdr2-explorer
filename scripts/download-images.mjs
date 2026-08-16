// Downloads all texture sample images referenced by public/data/tex_*.json
// from femga.com:8080 into public/images/samples/ so the app runs fully local.
// Usage: node scripts/download-images.mjs   (safe to re-run; skips existing files)
import { readFileSync, readdirSync, mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const DATA = join(ROOT, 'public', 'data')
const OUT = join(ROOT, 'public', 'images', 'samples')
const BASE = 'https://femga.com:8080/images/samples/'

const urls = new Set()
for (const f of readdirSync(DATA)) {
  if (!f.startsWith('tex_')) continue
  const j = JSON.parse(readFileSync(join(DATA, f), 'utf8'))
  const idx = j.fields.indexOf('url')
  for (const r of j.rows) urls.add(r[idx])
}
const list = [...urls]
console.log(`${list.length} images referenced`)

let done = 0
let skipped = 0
const failed = []

async function fetchOne(rel) {
  const dest = join(OUT, rel)
  if (existsSync(dest)) { skipped++; return }
  mkdirSync(dirname(dest), { recursive: true })
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(encodeURI(BASE + rel))
      if (!res.ok) throw new Error('HTTP ' + res.status)
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
      done++
      if ((done + skipped) % 250 === 0) console.log(`${done + skipped}/${list.length}`)
      return
    } catch (e) {
      if (attempt === 3) failed.push(`${rel}  (${e.message})`)
      else await new Promise((r) => setTimeout(r, 500 * attempt))
    }
  }
}

let i = 0
const CONCURRENCY = 10
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (i < list.length) await fetchOne(list[i++])
  })
)

console.log(`done: ${done} downloaded, ${skipped} already present, ${failed.length} failed`)
if (failed.length) console.log(failed.join('\n'))
process.exitCode = failed.length ? 1 : 0
