#!/usr/bin/env node
// MCP (Model Context Protocol) stdio server for the RDR2 EXPLORER datasets.
// Lets AI agents (Claude Code, etc.) search 412k+ RDR2/RedM entries — names,
// joaat hashes, animation dicts, sounds, controls, zones — without scraping.
//
// Data source: public/data in this repo when present, otherwise fetched from
// the deployed site (override with RDR2_DATA_URL).
//
// Usage:  node scripts/mcp-server.mjs
// Claude Code (this repo ships .mcp.json, so it is picked up automatically):
//   claude mcp add rdr2-explorer -- node <path>/scripts/mcp-server.mjs
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const LOCAL_DATA = join(ROOT, 'public', 'data')
const REMOTE_DATA = (process.env.RDR2_DATA_URL || 'https://quitfil3.github.io/rdr2-explorer/data/').replace(/\/?$/, '/')
const SITE = 'https://quitfil3.github.io/rdr2-explorer/'

// ---------- joaat (GetHashKey) ----------
function joaat(str) {
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
const toHex = (h) => '0x' + h.toString(16).toUpperCase().padStart(8, '0')
const toSigned = (h) => (h > 0x7fffffff ? h - 0x100000000 : h)

function parseHashInput(v) {
  const s = String(v).trim()
  if (/^0x[0-9a-f]+$/i.test(s)) return parseInt(s, 16) >>> 0
  if (/^-?\d+$/.test(s)) {
    let n = Number(s)
    if (n < 0) n += 0x100000000
    if (n >= 0 && n <= 0xffffffff) return n >>> 0
  }
  return null
}

// ---------- data loading ----------
async function loadJson(name) {
  const local = join(LOCAL_DATA, name)
  if (existsSync(local)) return JSON.parse(readFileSync(local, 'utf8'))
  const res = await fetch(REMOTE_DATA + name)
  if (!res.ok) throw new Error(`fetch ${name}: HTTP ${res.status}`)
  return res.json()
}

let manifest = null
const datasets = new Map()
async function getManifest() {
  manifest ||= await loadJson('manifest.json')
  return manifest
}
async function getDataset(id) {
  if (!datasets.has(id)) datasets.set(id, await loadJson(id + '.json'))
  return datasets.get(id)
}

// flat index (lazy): { n, c, g, j } for every entry
let flatIndex = null
async function getIndex() {
  if (flatIndex) return flatIndex
  const out = []
  for (const cat of await getManifest()) {
    const d = await getDataset(cat.id)
    if (d.kind === 'rows') {
      for (const r of d.rows) {
        const n = String(r[0])
        out.push({ n, c: cat.id, g: null, j: joaat(n) })
      }
    } else {
      for (const [gname, members] of Object.entries(d.groups)) {
        out.push({ n: gname, c: cat.id, g: null, j: joaat(gname) })
        for (const m of members) out.push({ n: m, c: cat.id, g: gname, j: joaat(m) })
      }
    }
  }
  flatIndex = out
  return out
}

const entryLink = (c, e) =>
  SITE + `#/c/${c}?sel=${encodeURIComponent(e.n)}` + (e.g ? `&selg=${encodeURIComponent(e.g)}` : '')

// ---------- tools ----------
const TOOLS = [
  {
    name: 'list_categories',
    description:
      'List every dataset in the RDR2/RedM knowledge base with id, title, kind (rows|groups), entry count and row fields.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'search',
    description:
      'Search all 412k+ RDR2/RedM entries by name substring, or reverse-lookup a joaat hash (hex like 0x169F59F7, unsigned or signed decimal). Returns matching entries with category, group and hash.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'name substring or a hash (0x…, decimal, signed)' },
        category: { type: 'string', description: 'optional dataset id to limit the search' },
        limit: { type: 'number', description: 'max results (default 25, max 200)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_entry',
    description:
      'Fetch one entry by exact name: all row fields (hash, coords, facets…) or its group membership, plus joaat forms and a web deep link.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'dataset id (see list_categories)' },
        name: { type: 'string', description: 'exact entry name' },
      },
      required: ['category', 'name'],
    },
  },
  {
    name: 'hash_name',
    description: 'Compute the joaat / GetHashKey hash of any string (hex, unsigned and signed int forms).',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    },
  },
]

async function callTool(name, args = {}) {
  if (name === 'list_categories') {
    const m = await getManifest()
    return m
      .map(
        (c) =>
          `${c.id} — ${c.title} (${c.kind}, ${c.count} entries${c.fields ? ', fields: ' + c.fields.join('/') : ''})`
      )
      .join('\n')
  }

  if (name === 'search') {
    const limit = Math.min(Math.max(1, args.limit || 25), 200)
    const idx = await getIndex()
    const hash = parseHashInput(args.query)
    const q = String(args.query).toLowerCase()
    const out = []
    for (const e of idx) {
      if (args.category && e.c !== args.category) continue
      if (hash !== null ? e.j === hash : e.n.toLowerCase().includes(q)) {
        out.push(e)
        if (out.length >= limit) break
      }
    }
    if (!out.length) return hash !== null ? `no entry found for hash ${toHex(hash)}` : `no matches for "${args.query}"`
    return out
      .map((e) => `${e.n}  [${e.c}${e.g ? ' / ' + e.g : ''}]  ${toHex(e.j)}`)
      .join('\n')
  }

  if (name === 'get_entry') {
    const m = await getManifest()
    const cat = m.find((c) => c.id === args.category)
    if (!cat) return `unknown category "${args.category}" — use list_categories`
    const d = await getDataset(cat.id)
    const h = joaat(args.name)
    const forms = `joaat: ${toHex(h)} · uint: ${h} · int: ${toSigned(h)}`
    if (d.kind === 'rows') {
      const row = d.rows.find((r) => String(r[0]) === args.name)
      if (!row) return `"${args.name}" not found in ${cat.id}`
      const fields = d.fields.map((f, i) => `${f}: ${row[i]}`).join('\n')
      return `${fields}\n${forms}\nlink: ${entryLink(cat.id, { n: args.name })}`
    }
    if (d.groups[args.name]) {
      const members = d.groups[args.name]
      return `group "${args.name}" (${members.length} members):\n${members.join('\n')}\n${forms}`
    }
    for (const [gname, members] of Object.entries(d.groups)) {
      if (members.includes(args.name)) {
        return `${args.name}\ngroup: ${gname}\n${forms}\nlink: ${entryLink(cat.id, { n: args.name, g: gname })}`
      }
    }
    return `"${args.name}" not found in ${cat.id}`
  }

  if (name === 'hash_name') {
    const h = joaat(args.name)
    return `joaat("${args.name}") = ${toHex(h)} · uint: ${h} · int: ${toSigned(h)}`
  }

  throw new Error(`unknown tool: ${name}`)
}

// ---------- JSON-RPC over stdio (newline-delimited) ----------
const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n')
const reply = (id, result) => send({ jsonrpc: '2.0', id, result })
const replyError = (id, code, message) => send({ jsonrpc: '2.0', id, error: { code, message } })

async function handle(msg) {
  const { id, method, params } = msg
  if (method === 'initialize') {
    reply(id, {
      protocolVersion: params?.protocolVersion || '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'rdr2-explorer', version: '1.0.0' },
    })
  } else if (method === 'tools/list') {
    reply(id, { tools: TOOLS })
  } else if (method === 'tools/call') {
    try {
      const text = await callTool(params.name, params.arguments)
      reply(id, { content: [{ type: 'text', text }] })
    } catch (e) {
      reply(id, { content: [{ type: 'text', text: 'error: ' + e.message }], isError: true })
    }
  } else if (method === 'ping') {
    reply(id, {})
  } else if (id !== undefined && !String(method).startsWith('notifications/')) {
    replyError(id, -32601, `method not found: ${method}`)
  }
}

let buf = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => {
  buf += chunk
  let nl
  while ((nl = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, nl).trim()
    buf = buf.slice(nl + 1)
    if (!line) continue
    try {
      handle(JSON.parse(line))
    } catch { /* ignore malformed lines */ }
  }
})
process.stdin.on('end', () => process.exit(0))
