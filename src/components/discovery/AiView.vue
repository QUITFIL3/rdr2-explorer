<script setup>
import { t } from '../../i18n.js'
import { copyText } from '../../lib/joaat.js'
import Icon from '../common/Icon.vue'
import CodeBlock from '../common/CodeBlock.vue'

defineProps({ manifest: { type: Array, required: true } })

// canonical deployed URL (matches index.html <link rel="canonical">)
const SITE = 'https://quitfil3.github.io/rdr2-explorer/'

const ENDPOINTS = [
  { label: 'manifest', url: SITE + 'data/manifest.json' },
  { label: 'dataset', url: SITE + 'data/<id>.json' },
  { label: 'model images', url: SITE + 'data/model_images.json' },
  { label: 'llms.txt', url: SITE + 'llms.txt' },
]

const SHAPE_ROWS = `{
  "kind": "rows",
  "fields": ["name", "hash", "group", "status"],
  "rows": [
    ["weapon_revolver_cattleman", "0x169F59F7", "revolver", "sp and mp"]
  ]
}`

const SHAPE_GROUPS = `{
  "kind": "groups",
  "groups": {
    "script_re@bear_trap": ["idle_a", "struggle_loop", "escape_r"]
  }
}`

const FETCH_EXAMPLE = `-- any HTTP client works; no auth, CORS is open. JS example:
-- const manifest = await (await fetch('${SITE}data/manifest.json')).json()
-- const weapons  = await (await fetch('${SITE}data/weapons.json')).json()`

const MCP_EXAMPLE = `# MCP server (Claude Code / any MCP client) — search all datasets,
# reverse hash lookup, entry details, joaat calculator. No clone needed:
claude mcp add rdr2-explorer -- npx -y github:QUITFIL3/rdr2-explorer

# or grab the single file (no npm, data is fetched from this site):
#   curl -O ${SITE}mcp-server.mjs
#   claude mcp add rdr2-explorer -- node mcp-server.mjs
# tools: list_categories · search · get_entry · hash_name`

const AI_PROMPT = `You can query the RDR2 EXPLORER knowledge base (Red Dead Redemption 2 /
RedM game data) as static JSON — no auth needed:

1. GET ${SITE}data/manifest.json
   -> list of datasets: { id, title, kind, count, fields }
2. GET ${SITE}data/<id>.json
   - kind "rows":   { fields, rows } — rows[i][j] matches fields[j];
     fields[0] is the entry name
   - kind "groups": { groups: { name: members[] } }
     (e.g. animation dicts -> animation names)

Datasets: peds, vehicles, objects, weapons, weapon_components, ammo, anims,
scenarios, emotes, soundsets, music_events, audio_banks, ptfx, doors,
interiors, weather, timecycles and more (see manifest).

When generating RedM Lua, use exact names/hashes from these datasets — never
invent model, animation or sound names. Hashes are joaat (GetHashKey).
Full docs: ${SITE}llms.txt`
</script>

<template>
  <div class="ai-page">
    <header class="cat-header">
      <h1><Icon class="cat-icon" name="zap" :size="18" /> {{ t('aiTitle') }}</h1>
      <p class="cat-desc">{{ t('aiIntro') }}</p>
    </header>

    <section class="ai-section">
      <div class="panel-label">{{ t('aiEndpoints') }}</div>
      <div class="row-list">
        <div v-for="e in ENDPOINTS" :key="e.label" class="row" @click="copyText(e.url)">
          <span class="row-name">{{ e.url }}</span>
          <span class="row-meta">
            <span class="chip small ghost">{{ e.label }}</span>
            <button class="chip small accent" :title="t('copy')" @click.stop="copyText(e.url)">{{ t('copy') }}</button>
          </span>
        </div>
      </div>
      <p class="ai-hint">{{ t('aiCors') }}</p>
    </section>

    <section class="ai-section">
      <div class="panel-label">{{ t('aiShapes') }}</div>
      <div class="ai-shapes">
        <CodeBlock :code="SHAPE_ROWS" lang="json" />
        <CodeBlock :code="SHAPE_GROUPS" lang="json" />
      </div>
      <p class="ai-hint">{{ t('aiShapesHint') }}</p>
    </section>

    <section class="ai-section">
      <div class="panel-label">{{ t('aiFetch') }}</div>
      <CodeBlock :code="FETCH_EXAMPLE" lang="lua" />
    </section>

    <section class="ai-section">
      <div class="panel-label">{{ t('aiMcp') }}</div>
      <p class="ai-hint">{{ t('aiMcpHint') }}</p>
      <CodeBlock :code="MCP_EXAMPLE" lang="text" />
    </section>

    <section class="ai-section">
      <div class="panel-label">{{ t('aiPrompt') }}</div>
      <p class="ai-hint">{{ t('aiPromptHint') }}</p>
      <CodeBlock :code="AI_PROMPT" lang="text" />
    </section>
  </div>
</template>

<style>
.ai-page { max-width: 860px; margin: 0 auto; padding: var(--sp-6) var(--sp-8) var(--sp-16); }
.ai-section { margin-top: var(--sp-6); }
.ai-section .row-name { font-size: var(--fs-sm); }
.ai-hint { margin-top: var(--sp-2); font-size: var(--fs-sm); color: var(--text-muted); }
.ai-shapes { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-3); }

@media (max-width: 900px) {
  .ai-shapes { grid-template-columns: 1fr; }
}
@media (max-width: 720px) {
  .ai-page { padding: var(--sp-5) var(--sp-3) var(--sp-10); }
}
</style>
