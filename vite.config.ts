import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
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
