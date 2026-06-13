import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    // PWA2 — Workbox service worker
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: false, // we have our own public/manifest.json
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MiB — bundle exceeds 2 MiB default
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Always fetch reports fresh — never cache
            urlPattern: /^https?:\/\/.*\/api\/reports\/all/,
            handler: 'NetworkOnly',
          },
          {
            // Cache map tiles
            urlPattern: /^https:\/\/basemaps\.cartocdn\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
          {
            // Cache Nominatim geocoding
            urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'geocoding-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // disable in dev to avoid conflicts
      },
    }),
  ],

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/maplibre-gl')) {
            return 'maplibre';
          }
        },
      },
    },
  },

  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
})