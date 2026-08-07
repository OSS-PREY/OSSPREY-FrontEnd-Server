import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// Deliberately not reusing vite.config.js: that build pulls in Vuetify's
// auto-import, layout and icon plugins, which need the whole app to resolve.
// These tests mount single components against fixtures, so the aliases and the
// Vue plugin are all they need.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/@core', import.meta.url)),
      '@layouts': fileURLToPath(new URL('./src/@layouts', import.meta.url)),
      '@images': fileURLToPath(new URL('./src/assets/images/', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/assets/styles/', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.{js,mjs}'],
    globals: true,
    server: { deps: { inline: ['vuetify'] } },
  },
})
