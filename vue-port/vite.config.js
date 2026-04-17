import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_SERVER_URL || 'http://localhost:9999';

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ['vue', 'vue-router', 'pinia'],
            ionic: ['@ionic/vue', '@ionic/vue-router', 'ionicons'],
            grid: ['ag-grid-community', 'ag-grid-vue3'],
            data: ['axios', 'moment', 'papaparse', 'fecha']
          }
        }
      }
    },
    server: {
      host: '0.0.0.0',
      port: 6789,
      strictPort: true,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false
        },
        '/images': {
          target,
          changeOrigin: true,
          secure: false
        }
      }
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/tests/setup.js'],
      globals: true
    }
  };
});
