import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves under /<repo>/; the iOS build uses BASE_PATH=./
const base = process.env.BASE_PATH ?? '/working-time-tracker/';

export default defineConfig({
  base,
  plugins: [
    svelte(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: false,
      registerType: 'autoUpdate',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,webmanifest}'],
        // Swagger UI is large and only needed for API testing; loaded from network.
        globIgnores: ['**/api-*.{js,css}', 'api.html'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: 'Working Time',
        short_name: 'Working Time',
        description: 'Track working hours, projects and office quota',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#f7f7f5',
        theme_color: '#2f6f5e',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        // Desktop: installed PWA handles web+wtt:// links (Chromium)
        protocol_handlers: [{ protocol: 'web+wtt', url: `${base}#/do/%s` }],
        launch_handler: { client_mode: 'focus-existing' },
        handle_links: 'preferred',
      } as Record<string, unknown>,
    }),
  ],
  build: {
    rollupOptions: { input: { main: 'index.html', api: 'api.html' } },
    chunkSizeWarningLimit: 1600,
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      include: [
        'src/domain/**',
        'src/application/**',
        'src/adapters/{storage/partition,holidays/ical,automation/deeplink,export/formatters}.ts',
      ],
      thresholds: { 'src/domain/**': { lines: 90, branches: 80 } },
    },
  },
});
