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
        '/api': {
          target: 'http://192.168.3.6:8000',
          changeOrigin: true,
          secure: false,
          // rewrite路径也可以用，根据你的后端是否需要/api前缀
          // rewrite: (path) => path.replace(/^\/api/, ''),
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
    },
  };
});
