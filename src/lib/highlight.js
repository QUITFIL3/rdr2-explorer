// Tiny line-based syntax highlighter for the generated Lua snippets and the
// dev-mode JSON records. Returns [{ s, cls }] tokens per line; CodeBlock.vue
// renders them as plain text spans, so no HTML is ever injected.
// Line-based is enough here: the site's snippets never span strings or
// comments across lines.

const LUA_KEYWORDS = new Set([
  'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
  'goto', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then',
  'true', 'until', 'while',
])

// order matters: comment > string > number > word > whitespace > single punct
// (punct is single-char so a `--` after `)` still starts a comment)
const LUA_RE = /--.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|0[xX][0-9a-fA-F]+|\d+(?:\.\d+)?|[A-Za-z_]\w*|\s+|[^\sA-Za-z0-9_]/g

function lua(line) {
  const out = []
  LUA_RE.lastIndex = 0
  let m
  while ((m = LUA_RE.exec(line))) {
    const s = m[0]
    let cls = ''
    if (s.startsWith('--')) cls = 'tok-comment'
    else if (s[0] === '"' || s[0] === "'") cls = 'tok-string'
    else if (/^(?:0[xX]|\d)/.test(s)) cls = 'tok-number'
    else if (/^[A-Za-z_]/.test(s)) {
      if (LUA_KEYWORDS.has(s)) cls = 'tok-keyword'
      else if (line[LUA_RE.lastIndex] === '(') cls = 'tok-call'
    } else if (!/^\s/.test(s)) cls = 'tok-punct'
    out.push({ s, cls })
  }
  return out
}

const JSON_RE = /"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|\s+|./g

function json(line) {
  const out = []
  JSON_RE.lastIndex = 0
  let m
  while ((m = JSON_RE.exec(line))) {
    const s = m[0]
    let cls = ''
    if (s[0] === '"') cls = /^\s*:/.test(line.slice(JSON_RE.lastIndex)) ? 'tok-key' : 'tok-string'
    else if (/^-?\d/.test(s)) cls = 'tok-number'
    else if (s === 'true' || s === 'false' || s === 'null') cls = 'tok-keyword'
    else if (!/^\s/.test(s)) cls = 'tok-punct'
    out.push({ s, cls })
  }
  return out
}

export function tokenizeLine(line, lang) {
  if (lang === 'lua') return lua(line)
  if (lang === 'json') return json(line)
  return [{ s: line, cls: '' }]
}
