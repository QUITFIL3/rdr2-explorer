// Downloads model preview images (peds / vehicles / objects) from
// BryceCanyonCounty/rdr3-nativedb-data (the repo behind redlookup.com)
// into public/images/models/<model>.jpg  (front view, "x1" angle).
// Enumerates the repo tree first so only files that actually exist are fetched.
// Usage: node scripts/download-model-images.mjs   (re-runnable; skips existing)
// Credit: images (c) Rockstar Games, collected by BryceCanyonCounty / RedLookup.com
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const DATA = join(ROOT, 'public', 'data')
const OUT = join(ROOT, 'public', 'images', 'models')
mkdirSync(OUT, { recursive: true })

const CDN = 'https://cdn.jsdelivr.net/gh/BryceCanyonCounty/rdr3-nativedb-data@master/'
const RAW = 'https://raw.githubusercontent.com/BryceCanyonCounty/rdr3-nativedb-data/master/'

// 1. enumerate available image files (exact paths -> handles the 274 mixed-case names)
// Preferred: a pre-generated list file (git ls-tree output) passed as argv[2];
// fallback: the GitHub trees API (which 500s intermittently on this repo).
const avail = new Map()
if (process.argv[2]) {
  for (const line of readFileSync(process.argv[2], 'utf8').split('\n')) {
    const p = line.trim()
    if (!p.startsWith('objects/images/') || !p.endsWith('.jpg')) continue
    avail.set(p.slice('objects/images/'.length).toLowerCase(), p)
  }
} else {
  console.log('fetching repo tree...')
  const treeRes = await fetch(
    'https://api.github.com/repos/BryceCanyonCounty/rdr3-nativedb-data/git/trees/master?recursive=1'
  )
  if (!treeRes.ok) throw new Error('tree fetch failed: HTTP ' + treeRes.status)
  const tree = await treeRes.json()
  if (tree.truncated) console.warn('warning: tree listing truncated')
  for (const e of tree.tree) {
    if (e.path.startsWith('objects/images/') && e.path.endsWith('.jpg')) {
      avail.set(e.path.slice('objects/images/'.length).toLowerCase(), e.path)
    }
  }
}
console.log(`repo has ${avail.size} images`)

// 2. our model names (peds, vehicles, objects)
const wanted = []
for (const id of ['peds', 'vehicles', 'objects']) {
  const j = JSON.parse(readFileSync(join(DATA, id + '.json'), 'utf8'))
  const ni = j.fields.indexOf('name')
  for (const r of j.rows) {
    const name = String(r[ni]).toLowerCase()
    const path = avail.get(name + 'x1.jpg')
    if (path) wanted.push([name, path])
  }
}
console.log(`${wanted.length} of our models have an image`)

// 3. download (skip existing)
let done = 0
let skipped = 0
const failed = []
async function fetchOne([name, path]) {
  const dest = join(OUT, name + '.jpg')
  if (existsSync(dest)) { skipped++; return }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const url = (attempt < 3 ? CDN : RAW) + path
      const res = await fetch(encodeURI(url))
      if (!res.ok) throw new Error('HTTP ' + res.status)
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
      done++
      if ((done + skipped) % 250 === 0) console.log(`${done + skipped}/${wanted.length}`)
      return
    } catch (e) {
      if (attempt === 3) failed.push(`${name}  (${e.message})`)
      else await new Promise((r) => setTimeout(r, 600 * attempt))
    }
  }
}
let i = 0
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (i < wanted.length) await fetchOne(wanted[i++])
  })
)
console.log(`done: ${done} downloaded, ${skipped} already present, ${failed.length} failed`)
if (failed.length) console.log(failed.slice(0, 50).join('\n'))

// 4. write the model-image index for the frontend: { name: exactRepoFilename }
// (exact filename is needed to hotlink the CDN in production; local files are <name>.jpg)
const index = {}
for (const [name, path] of wanted) {
  if (existsSync(join(OUT, name + '.jpg'))) index[name] = path.slice('objects/images/'.length)
}
writeFileSync(join(DATA, 'model_images.json'), JSON.stringify(index))
console.log(`index written: ${Object.keys(index).length} names -> public/data/model_images.json`)
