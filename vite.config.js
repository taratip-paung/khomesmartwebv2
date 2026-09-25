import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import solarDevApi from './solar-server/devPlugin.mjs'
import solarOgPage from './solar-server/solarOgPage.mjs'

export default defineConfig({
  plugins: [react(), solarDevApi(), solarOgPage()], // solarDevApi: /api/solar/* in dev (runs before the /api proxy) · solarOgPage: dist/solar/index.html with /solar share tags
  server: {
    // contact form → server/contact-server.mjs during development
    proxy: { '/api': 'http://127.0.0.1:8787' },
  },
  build: {
    target: 'es2020',
    // Browser targets for the CSS minifier (lightningcss). Without this it strips the unprefixed
    // `backdrop-filter` when a `-webkit-` copy follows it → no glass blur in Chrome on production
    // (dev was fine because dev CSS isn't minified). With targets set it auto-adds -webkit- for Safari,
    // so global.css must contain ONLY the unprefixed properties.
    cssTarget: ['chrome90', 'safari15', 'ios15', 'firefox90', 'edge90'],
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('@react-three')) return 'r3f'
        },
      },
    },
  },
})
