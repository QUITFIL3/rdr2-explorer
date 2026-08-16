<script setup>
import { ref, computed } from 'vue'
import { copyText } from '../../lib/joaat.js'
import { tokenizeLine } from '../../lib/highlight.js'
import { t } from '../../i18n.js'
import Icon from './Icon.vue'

const props = defineProps({
  code: { type: String, required: true },
  lang: { type: String, default: 'lua' },
})

const lines = computed(() =>
  props.code.split('\n').map((line) => tokenizeLine(line, props.lang))
)

const copied = ref(false)
let timer
async function copy() {
  await copyText(props.code)
  copied.value = true
  clearTimeout(timer)
  timer = setTimeout(() => (copied.value = false), 1600)
}
</script>

<template>
  <div class="code-block">
    <div class="code-head">
      <span class="code-lang">{{ lang }}</span>
      <button class="chip small" :class="{ accent: copied }" @click="copy">
        <Icon :name="copied ? 'check' : 'copy'" :size="11" />
        {{ copied ? 'copied' : t('copy') }}
      </button>
    </div>
    <pre class="code mono"><code><span
      v-for="(line, i) in lines"
      :key="i"
      class="code-line"
    ><span class="code-ln">{{ i + 1 }}</span><span v-for="(tk, j) in line" :key="j" :class="tk.cls || null">{{ tk.s }}</span>
</span></code></pre>
  </div>
</template>

<style>
.code-block {
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--code-bg);
}
.code-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-1) var(--sp-2) var(--sp-1) var(--sp-3);
  border-bottom: 1px solid var(--border-muted);
  background: var(--bg-secondary);
}
.code-lang {
  font-size: var(--fs-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent-secondary);
}
.code-head .chip { display: inline-flex; align-items: center; gap: 4px; border: none; }
.code-block .code {
  padding: var(--sp-3) var(--sp-3) var(--sp-3) 0;
  font-size: var(--fs-sm);
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre;
  color: var(--text-primary);
}
.code-line { display: block; }
.code-ln {
  display: inline-block;
  width: 34px;
  padding-right: var(--sp-3);
  text-align: right;
  color: var(--text-muted);
  user-select: none;
  opacity: 0.55;
}

/* syntax colors — theme tokens only, so both palettes keep their contrast floor */
.code .tok-keyword { color: var(--accent-primary); }
.code .tok-string { color: var(--success); }
.code .tok-number { color: var(--info); }
.code .tok-call { color: var(--accent-secondary); }
.code .tok-key { color: var(--accent-secondary); }
.code .tok-punct { color: var(--text-secondary); }
.code .tok-comment { color: var(--text-muted); font-style: italic; }
</style>
