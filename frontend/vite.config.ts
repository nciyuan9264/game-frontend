import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/', // 让静态资源路径加上 /h5/
  server: {
    open: true,
    host: true,
    port: 3001,
    proxy: {
      "/api": {
        target: "http://192.168.3.6:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        secure: false,
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
    target: 'es2020', // 降级 JS 目标版本
  },
});
