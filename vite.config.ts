import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => {
  // const env = loadEnv(mode, process.cwd());
  // const apiBase = env.VITE_API_BASE;

  return {
    define: {
      'process.env': {},
    },
    plugins: [react()],
    base: '/',
    server: {
      open: true,
      host: true,
      port: 3001,
      proxy: {
        '/api/splendor': {
          target: 'http://192.168.3.6:8000',
          changeOrigin: true,
          secure: false,
          rewrite: path => path.replace(/^\/api\/splendor/, ''),
        },
        '/api/acquire': {
          target: 'http://192.168.3.6:8000',
          changeOrigin: true,
          secure: false,
          rewrite: path => path.replace(/^\/api\/acquire/, ''),
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
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'vendor-react';
              if (id.includes('antd')) return 'vendor-antd';
              return 'vendor'; // 其他 node_modules
            }
          },
        },
      },
    },
  };
});
