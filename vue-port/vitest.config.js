import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src')
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: [path.resolve(rootDir, 'src/tests/setup.js')],
    globals: true
  }
});
