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
      // proxy: {
      //   '/api': {
      //     target: apiBase,
      //     changeOrigin: true,
      //     rewrite: (path) => path.replace(/^\/api/, ''),
      //     secure: false,
      //   },
      // },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '~': '/src',
      },
    },
    build: {
      target: 'es2020',
    },
  };
});
