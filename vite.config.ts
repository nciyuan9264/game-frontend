import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const devRefreshToken = env.DEV_REFRESH_TOKEN?.trim();

  return {
    plugins: [react(), VitePWA({
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      manifest: {
        name: 'GameBus',
        short_name: 'GameBus',
        description: 'GameBus board games',
        start_url: '/game/acquire',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#07151f',
        background_color: '#07151f',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/pam-api\//, /^\/ws/],
        globPatterns: [
          'index.html',
          'registerSW.js',
          'manifest.webmanifest',
          'assets/*.{js,css}',
          'icons/*.png',
          'site.png',
        ],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === self.location.origin &&
              /\.(?:png|jpg|jpeg|webp|svg|ico|woff2?|ttf)$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'gamebus-static-assets',
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    })],
    server: {
      open: true,
      host: true,
      port: 5173,
      proxy: {
        '/ws': {
          target: env.VITE_GAME_GATEWAY_TARGET || 'http://localhost:18000',
          changeOrigin: true,
          secure: true,
          ws: true,
        },
        '/pam-api': {
          target: env.VITE_PAM_GATEWAY_TARGET || 'http://localhost:19003',
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: '',
          configure: proxy => {
            proxy.on('proxyReq', (proxyRequest, request) => {
              if (!devRefreshToken || !request.url?.endsWith('/platform/auth/refresh')) {
                return;
              }
              const cookies = (request.headers.cookie ?? '')
                .split(';')
                .map(cookie => cookie.trim())
                .filter(cookie => cookie && !cookie.startsWith('refresh_token='));
              cookies.push(`refresh_token=${devRefreshToken}`);
              proxyRequest.setHeader('Cookie', cookies.join('; '));
            });
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '~': '/src',
      },
    },
    build: {
      target: 'es2020',
      chunkSizeWarningLimit: 1000, // 调大警告阈值（可选）
      modulePreload: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'vendor-react';
              if (id.includes('antd')) return 'vendor-antd';
              return 'vendor';
            }
          },
        },
      },
    },
  };
});
