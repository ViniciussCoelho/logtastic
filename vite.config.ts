/// <reference types="vitest/config" />
import { configDefaults } from 'vitest/config';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Phaser alone is ~1.2 MB minified; it is already split out and loaded only on entering The Dam.
  build: { chunkSizeWarningLimit: 1400 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Browser journeys live in e2e/ and run with Playwright, not Vitest.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});
