import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_SERVER_URL || 'http://localhost:9999';

  const devFaviconPlugin = {
    name: 'dev-favicon',
    apply: 'serve',
    transformIndexHtml(html) {
      return html.replace(
        '<title>',
        '<link rel="icon" type="image/png" href="/images/vue3-logo.png" />\n    <title>'
      );
    }
  };

  return {
    plugins: [vue(), devFaviconPlugin],
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
          secure: false,
          bypass(req) {
            // Local dev assets shipped under public/images must be served by Vite,
            // not proxied to the backend (which returns 422 for them).
            if (req.url && req.url.startsWith('/images/vue3-logo.png')) {
              return req.url;
            }
            return null;
          }
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
