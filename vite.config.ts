import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'AutoClaim',
        short_name: 'AutoClaim',
        description: 'Klaim asuransi kendaraan dalam hitungan menit',
        theme_color: '#4b61a1',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        globIgnores: ['**/assets/auth/login-cards/*.svg'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Font Poppins (Google Fonts) — jarang berubah.
            urlPattern: ({ url }) =>
              url.origin === 'https://fonts.googleapis.com' ||
              url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Ubin peta OpenStreetMap — cache agar peta cepat & hemat kuota.
            urlPattern: ({ url }) => url.host.endsWith('tile.openstreetmap.org'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5910,
    host: true,
  },
  build: {
    // Pisahkan dependency besar ke chunk vendor terpisah agar:
    // - cache browser awet (vendor jarang berubah dibanding kode app),
    // - peta (Leaflet) hanya diunduh saat halaman berpeta dibuka.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('leaflet')) return 'maps'; // leaflet + react-leaflet
          if (id.includes('@tanstack')) return 'query';
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod'))
            return 'forms';
          if (id.includes('react-router') || id.includes('@remix-run')) return 'router';
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler'))
            return 'react-vendor';
          return undefined;
        },
      },
    },
  },
});
