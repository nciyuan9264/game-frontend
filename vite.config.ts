import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      open: true,
      host: true,
      port: 5173,
      proxy: {
        '/api/acquire': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/acquire/, ''),
        },
        '/api/davinci': {
          target: 'http://localhost:8001',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/davinci/, ''),
        },
        '/api/splendor': {
          target: 'http://localhost:8002',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/splendor/, ''),
        },
        '/pam-api': {
          target: env.VITE_PAM_GATEWAY_TARGET || 'http://localhost:19003',
          changeOrigin: true,
          secure: true,
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
              if (id.includes('@babylonjs') || id.includes('babylonjs')) return 'vendor-babylon';
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
