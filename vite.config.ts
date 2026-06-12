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
              'access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImV4cCI6MTc4MTE5MTU4NiwiaWF0IjoxNzgxMTgyNTg2LCJqdGkiOiI3Yzc0NWIzZC1mMjIxLTRlYWUtOGYxNi04NGMxMmFhNTBjZjQifQ.cq2Y-Q-PnCggHFtOpElEME2C0KJdkjPdygeJwM5HSYZzzr02R7oPrc824k4CMk_lTp4WSnPWH7-152hXMWscP2q6hqMXJVIVwsc6_53-qEzIo4vKIO3eArKGSGlMEOO-hX7Ouq6w2JhRJezbhuPDowW3uiN0Woqa5pdML6iyHvIhcc5NLLxjVr9GSKBXkUxNK81io8P3lbw2zWg1NoMG1EHZOVld80NAOx04tMn77Q4v2oDGUZInkatSZHNrzomgWo0UrNs_sy0JMBO7NGuknGWtqiJilh23JY78XabaH7OU4a-m5JupG7hhulDlCmFrDN0q2liR3Z2UVhk099957w',
          },
        },
        '/api/davinci': {
          target: 'http://localhost:8001',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/davinci/, ''),
          headers: {
            Cookie:
              'access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImV4cCI6MTc4MTE5MTU4NiwiaWF0IjoxNzgxMTgyNTg2LCJqdGkiOiI3Yzc0NWIzZC1mMjIxLTRlYWUtOGYxNi04NGMxMmFhNTBjZjQifQ.cq2Y-Q-PnCggHFtOpElEME2C0KJdkjPdygeJwM5HSYZzzr02R7oPrc824k4CMk_lTp4WSnPWH7-152hXMWscP2q6hqMXJVIVwsc6_53-qEzIo4vKIO3eArKGSGlMEOO-hX7Ouq6w2JhRJezbhuPDowW3uiN0Woqa5pdML6iyHvIhcc5NLLxjVr9GSKBXkUxNK81io8P3lbw2zWg1NoMG1EHZOVld80NAOx04tMn77Q4v2oDGUZInkatSZHNrzomgWo0UrNs_sy0JMBO7NGuknGWtqiJilh23JY78XabaH7OU4a-m5JupG7hhulDlCmFrDN0q2liR3Z2UVhk099957w',
          },
        },
        '/auth': {
          target: 'https://api.gamebus.online',
          changeOrigin: true,
          secure: true,
          headers: {
            Cookie:
              'access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImV4cCI6MTc4MTE5MTU4NiwiaWF0IjoxNzgxMTgyNTg2LCJqdGkiOiI3Yzc0NWIzZC1mMjIxLTRlYWUtOGYxNi04NGMxMmFhNTBjZjQifQ.cq2Y-Q-PnCggHFtOpElEME2C0KJdkjPdygeJwM5HSYZzzr02R7oPrc824k4CMk_lTp4WSnPWH7-152hXMWscP2q6hqMXJVIVwsc6_53-qEzIo4vKIO3eArKGSGlMEOO-hX7Ouq6w2JhRJezbhuPDowW3uiN0Woqa5pdML6iyHvIhcc5NLLxjVr9GSKBXkUxNK81io8P3lbw2zWg1NoMG1EHZOVld80NAOx04tMn77Q4v2oDGUZInkatSZHNrzomgWo0UrNs_sy0JMBO7NGuknGWtqiJilh23JY78XabaH7OU4a-m5JupG7hhulDlCmFrDN0q2liR3Z2UVhk099957w',
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
