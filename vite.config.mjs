import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './',
  // deploy builds copy public/ selectively (scripts/deploy-pages.mjs) so the
  // multi-GB model image set never lands in the published site
  publicDir: process.env.DEPLOY_PAGES ? false : 'public',
  plugins: [vue()],
  server: {
    watch: {
      // ~17k downloaded images live under public/images; watching them makes
      // the dev server crawl (they are static and never edited by hand)
      ignored: ['**/public/images/**'],
    },
  },
})
