import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => {
  // const env = loadEnv(mode, process.cwd());
  // const apiBase = env.VITE_API_BASE;

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
          headers: {
            Cookie:
              'access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImV4cCI6MTc4MTI3ODU3MywiaWF0IjoxNzgxMjY5NTczLCJqdGkiOiI5N2E5ZmJjNS02NDYwLTRlOTMtODI5ZS03MTNjZDk3ZGE0NGQifQ.qpyrJ0hpeGEEtPaw9_yb4APFXHo_kLZdOG1j8qecLksBRlrZXJVo_MEXPw1WZWpRfwwdcZI4uN4KlBoNtz8R3mlUlItoWql_6JgTuHzZalSCEI6aRA30GLI7fS373Kd0HItHLjQemwhtnX_es6jI6TbXjgFDpbLNLGKwV7NA8qyxq6_J9mwQ_DOKLXLKLCzHshA6rm0-UQOBqwmwVSzoobGVIm217QECV5OzAjrUZsCRHYHsPBBqpDqS6Z15Yt5cExrmo1KKBBTRrL4-VhfP1z36meExcPNyyIvZ-cZx_rU-VY4M_W314ETEPUX9ydKmycjHyU1Du5dmZpS7kGvuDw',
          },
        },
        '/api/davinci': {
          target: 'http://localhost:8001',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/davinci/, ''),
          headers: {
            Cookie:
              'access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImV4cCI6MTc4MTI3ODU3MywiaWF0IjoxNzgxMjY5NTczLCJqdGkiOiI5N2E5ZmJjNS02NDYwLTRlOTMtODI5ZS03MTNjZDk3ZGE0NGQifQ.qpyrJ0hpeGEEtPaw9_yb4APFXHo_kLZdOG1j8qecLksBRlrZXJVo_MEXPw1WZWpRfwwdcZI4uN4KlBoNtz8R3mlUlItoWql_6JgTuHzZalSCEI6aRA30GLI7fS373Kd0HItHLjQemwhtnX_es6jI6TbXjgFDpbLNLGKwV7NA8qyxq6_J9mwQ_DOKLXLKLCzHshA6rm0-UQOBqwmwVSzoobGVIm217QECV5OzAjrUZsCRHYHsPBBqpDqS6Z15Yt5cExrmo1KKBBTRrL4-VhfP1z36meExcPNyyIvZ-cZx_rU-VY4M_W314ETEPUX9ydKmycjHyU1Du5dmZpS7kGvuDw',
          },
        },
        '/api/splendor': {
          target: 'http://localhost:8002',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/splendor/, ''),
          headers: {
            Cookie:
              'access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImV4cCI6MTc4MTI3ODU3MywiaWF0IjoxNzgxMjY5NTczLCJqdGkiOiI5N2E5ZmJjNS02NDYwLTRlOTMtODI5ZS03MTNjZDk3ZGE0NGQifQ.qpyrJ0hpeGEEtPaw9_yb4APFXHo_kLZdOG1j8qecLksBRlrZXJVo_MEXPw1WZWpRfwwdcZI4uN4KlBoNtz8R3mlUlItoWql_6JgTuHzZalSCEI6aRA30GLI7fS373Kd0HItHLjQemwhtnX_es6jI6TbXjgFDpbLNLGKwV7NA8qyxq6_J9mwQ_DOKLXLKLCzHshA6rm0-UQOBqwmwVSzoobGVIm217QECV5OzAjrUZsCRHYHsPBBqpDqS6Z15Yt5cExrmo1KKBBTRrL4-VhfP1z36meExcPNyyIvZ-cZx_rU-VY4M_W314ETEPUX9ydKmycjHyU1Du5dmZpS7kGvuDw',
          },
        },
        '/auth': {
          target: 'https://api.gamebus.online',
          changeOrigin: true,
          secure: true,
          headers: {
            Cookie:
              'access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImV4cCI6MTc4MTI3ODU3MywiaWF0IjoxNzgxMjY5NTczLCJqdGkiOiI5N2E5ZmJjNS02NDYwLTRlOTMtODI5ZS03MTNjZDk3ZGE0NGQifQ.qpyrJ0hpeGEEtPaw9_yb4APFXHo_kLZdOG1j8qecLksBRlrZXJVo_MEXPw1WZWpRfwwdcZI4uN4KlBoNtz8R3mlUlItoWql_6JgTuHzZalSCEI6aRA30GLI7fS373Kd0HItHLjQemwhtnX_es6jI6TbXjgFDpbLNLGKwV7NA8qyxq6_J9mwQ_DOKLXLKLCzHshA6rm0-UQOBqwmwVSzoobGVIm217QECV5OzAjrUZsCRHYHsPBBqpDqS6Z15Yt5cExrmo1KKBBTRrL4-VhfP1z36meExcPNyyIvZ-cZx_rU-VY4M_W314ETEPUX9ydKmycjHyU1Du5dmZpS7kGvuDw',
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
