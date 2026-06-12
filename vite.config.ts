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
              'access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImV4cCI6MTc4MTI2MDA3NCwiaWF0IjoxNzgxMjUxMDc0LCJqdGkiOiIxZGRiMDRhNC1kZWY1LTRhMTItYjY4OS1jZDBiMGZkMWUxOWYifQ.fiau0DEb1wf8DMseHIJlNOHvjpPRjRZCVdNYabKxTJTwHXjQIsiMLa8EmQzci75aWh69x5m9dV8W0uilmWG1InVkPPl_Y94Uo2HpJTbGx4BDqXNbPb1ia5Blw2_4VsUcecbzUazAcOtDDUh0_EAKRl30f2QANwsowPTLry3liPjz2ECWnx_F809U4RxjNtlt0KSqcR9OxC4zNpWD0WIGvCjZXoMHh5j0C-L9WvtDKYeV5lpCkAXRs0u8u8HQrMdydPVohxdLU_Xd7sj1lohOFcagIKTH8a0YBZeFVvYrjpp15OUjjKmIYDB-cmY_xAfl-jTmKJ7icojUEFBNwRv1UQ',
          },
        },
        '/api/davinci': {
          target: 'http://localhost:8001',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/davinci/, ''),
          headers: {
            Cookie:
              'access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImV4cCI6MTc4MTI2MDA3NCwiaWF0IjoxNzgxMjUxMDc0LCJqdGkiOiIxZGRiMDRhNC1kZWY1LTRhMTItYjY4OS1jZDBiMGZkMWUxOWYifQ.fiau0DEb1wf8DMseHIJlNOHvjpPRjRZCVdNYabKxTJTwHXjQIsiMLa8EmQzci75aWh69x5m9dV8W0uilmWG1InVkPPl_Y94Uo2HpJTbGx4BDqXNbPb1ia5Blw2_4VsUcecbzUazAcOtDDUh0_EAKRl30f2QANwsowPTLry3liPjz2ECWnx_F809U4RxjNtlt0KSqcR9OxC4zNpWD0WIGvCjZXoMHh5j0C-L9WvtDKYeV5lpCkAXRs0u8u8HQrMdydPVohxdLU_Xd7sj1lohOFcagIKTH8a0YBZeFVvYrjpp15OUjjKmIYDB-cmY_xAfl-jTmKJ7icojUEFBNwRv1UQ',
          },
        },
        '/api/splendor': {
          target: 'http://localhost:8002',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/splendor/, ''),
          headers: {
            Cookie:
              'access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImV4cCI6MTc4MTI2MDA3NCwiaWF0IjoxNzgxMjUxMDc0LCJqdGkiOiIxZGRiMDRhNC1kZWY1LTRhMTItYjY4OS1jZDBiMGZkMWUxOWYifQ.fiau0DEb1wf8DMseHIJlNOHvjpPRjRZCVdNYabKxTJTwHXjQIsiMLa8EmQzci75aWh69x5m9dV8W0uilmWG1InVkPPl_Y94Uo2HpJTbGx4BDqXNbPb1ia5Blw2_4VsUcecbzUazAcOtDDUh0_EAKRl30f2QANwsowPTLry3liPjz2ECWnx_F809U4RxjNtlt0KSqcR9OxC4zNpWD0WIGvCjZXoMHh5j0C-L9WvtDKYeV5lpCkAXRs0u8u8HQrMdydPVohxdLU_Xd7sj1lohOFcagIKTH8a0YBZeFVvYrjpp15OUjjKmIYDB-cmY_xAfl-jTmKJ7icojUEFBNwRv1UQ',
          },
        },
        '/auth': {
          target: 'https://api.gamebus.online',
          changeOrigin: true,
          secure: true,
          headers: {
            Cookie:
              'access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImV4cCI6MTc4MTI2MDA3NCwiaWF0IjoxNzgxMjUxMDc0LCJqdGkiOiIxZGRiMDRhNC1kZWY1LTRhMTItYjY4OS1jZDBiMGZkMWUxOWYifQ.fiau0DEb1wf8DMseHIJlNOHvjpPRjRZCVdNYabKxTJTwHXjQIsiMLa8EmQzci75aWh69x5m9dV8W0uilmWG1InVkPPl_Y94Uo2HpJTbGx4BDqXNbPb1ia5Blw2_4VsUcecbzUazAcOtDDUh0_EAKRl30f2QANwsowPTLry3liPjz2ECWnx_F809U4RxjNtlt0KSqcR9OxC4zNpWD0WIGvCjZXoMHh5j0C-L9WvtDKYeV5lpCkAXRs0u8u8HQrMdydPVohxdLU_Xd7sj1lohOFcagIKTH8a0YBZeFVvYrjpp15OUjjKmIYDB-cmY_xAfl-jTmKJ7icojUEFBNwRv1UQ',
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
