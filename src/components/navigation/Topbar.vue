<script setup>
import { locale, toggleLocale, t } from '../../i18n.js'
import { effectiveTheme, toggleTheme } from '../../theme.js'
import { REPO_URL } from '../../categories.js'
import { devMode } from '../../lib/storage.js'
import Icon from '../common/Icon.vue'

defineEmits(['open-palette'])

const markUrl = import.meta.env.BASE_URL + 'brand/hexa-mark.png'
</script>

<template>
  <header class="topbar">
    <a class="logo" href="#/">
      <img class="logo-mark" :src="markUrl" alt="Hexa Development" width="26" height="26" />
      <span class="logo-text">RDR3 Discoveries</span>
    </a>

    <button class="global-search" @click="$emit('open-palette')">
      <Icon name="search" :size="13" />
      <span class="gs-label">{{ t('globalSearch') }}</span>
      <kbd>Ctrl K</kbd>
    </button>

    <div class="topbar-actions">
      <button
        v-if="devMode"
        class="chip small on dev-flag"
        :title="t('devModeOn')"
        @click="devMode = false"
      >DEV</button>
      <a class="icon-btn" :href="REPO_URL" target="_blank" rel="noopener" title="GitHub">
        <Icon name="github" :size="14" />
      </a>
      <button class="icon-btn lang" :title="t('switchLang')" @click="toggleLocale">
        {{ locale === 'en' ? 'ไทย' : 'EN' }}
      </button>
      <button
        class="icon-btn"
        :title="effectiveTheme === 'dark' ? t('switchLight') : t('switchDark')"
        @click="toggleTheme"
      >
        <Icon :name="effectiveTheme === 'dark' ? 'sun' : 'moon'" :size="14" />
      </button>
    </div>
  </header>
</template>

<style>
.topbar {
  height: var(--topbar-h);
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  padding: 0 var(--sp-4);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  position: sticky;
  top: 0;
  z-index: var(--z-topbar);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  color: var(--text-primary);
  flex-shrink: 0;
}
.logo:hover { text-decoration: none; }
.logo-mark {
  border-radius: var(--radius-sm);
  /* the mark ships on its own near-black plate, so it reads on either theme */
  border: 1px solid var(--border-primary);
  flex-shrink: 0;
}
.logo-text {
  font-family: var(--font-logo);
  font-size: var(--fs-lg);
  font-weight: 700;
  letter-spacing: 0.02em;
}

.global-search {
  flex: 1;
  max-width: 520px;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  background: var(--surface-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  padding: 6px var(--sp-3);
  font-size: var(--fs-base);
  cursor: pointer;
  transition: border-color var(--dur-fast);
}
.global-search:hover { border-color: var(--text-muted); }
.gs-label {
  flex: 1;
  text-align: left;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.global-search kbd,
kbd {
  font: var(--fs-xs) var(--font-mono);
  color: var(--text-muted);
  border: 1px solid var(--border-primary);
  border-bottom-width: 2px;
  border-radius: var(--radius-sm);
  padding: 0 5px;
  white-space: nowrap;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-left: auto;
  flex-shrink: 0;
}
.dev-flag { font-family: var(--font-mono); letter-spacing: 0.05em; }
.icon-btn.lang { width: auto; padding: 0 var(--sp-2); font-size: var(--fs-sm); font-weight: 600; }

@media (max-width: 720px) {
  .gs-label { display: none; }
  .global-search { flex: 0; }
  .logo-text { font-size: var(--fs-md); }
}
</style>
