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
              'access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImV4cCI6MTc4MTM2NjA3MywiaWF0IjoxNzgxMzU3MDczLCJqdGkiOiI0MzgzMmM2ZS1mZDRkLTRjNGItYTI0ZC0wMzAwNzM0NGExZTIifQ.QhYi2e4x0j09gnhT7OpMmkafe8BirnFK-7NNuedA8QXBzKCtAyz_a9XLBcW7k-JlUyYaMtYkf4EVOnWkNFEz5oHJGQp3OVp7BniKc50p4ukuvv7dA82peOUpCIzbTFPG2LtM_BmFwo_N3HJYthPYHleGhgLFWLPCycGkDfS6yngKBrxeMyCDxkVhsuXjJD8dpLzJBVMrOIA39Jq0eQvjuS5umPBmznseqfH28D_J0mjq_w7Ul1nfJ4i9S_kK5iA0QvCxPKQYmjFCg7TqAcM_zHRU1fadPcnJrcQkGK53pmMUIy-QjDe2mFOq8J13bZda8EnWdstLwCsmkCb826KcFg',
          },
        },
        '/api/davinci': {
          target: 'http://localhost:8001',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/davinci/, ''),
          headers: {
            Cookie:
              'access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImV4cCI6MTc4MTM2NjA3MywiaWF0IjoxNzgxMzU3MDczLCJqdGkiOiI0MzgzMmM2ZS1mZDRkLTRjNGItYTI0ZC0wMzAwNzM0NGExZTIifQ.QhYi2e4x0j09gnhT7OpMmkafe8BirnFK-7NNuedA8QXBzKCtAyz_a9XLBcW7k-JlUyYaMtYkf4EVOnWkNFEz5oHJGQp3OVp7BniKc50p4ukuvv7dA82peOUpCIzbTFPG2LtM_BmFwo_N3HJYthPYHleGhgLFWLPCycGkDfS6yngKBrxeMyCDxkVhsuXjJD8dpLzJBVMrOIA39Jq0eQvjuS5umPBmznseqfH28D_J0mjq_w7Ul1nfJ4i9S_kK5iA0QvCxPKQYmjFCg7TqAcM_zHRU1fadPcnJrcQkGK53pmMUIy-QjDe2mFOq8J13bZda8EnWdstLwCsmkCb826KcFg',
          },
        },
        '/api/splendor': {
          target: 'http://localhost:8002',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/splendor/, ''),
          headers: {
            Cookie:
              'access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImV4cCI6MTc4MTM2NjA3MywiaWF0IjoxNzgxMzU3MDczLCJqdGkiOiI0MzgzMmM2ZS1mZDRkLTRjNGItYTI0ZC0wMzAwNzM0NGExZTIifQ.QhYi2e4x0j09gnhT7OpMmkafe8BirnFK-7NNuedA8QXBzKCtAyz_a9XLBcW7k-JlUyYaMtYkf4EVOnWkNFEz5oHJGQp3OVp7BniKc50p4ukuvv7dA82peOUpCIzbTFPG2LtM_BmFwo_N3HJYthPYHleGhgLFWLPCycGkDfS6yngKBrxeMyCDxkVhsuXjJD8dpLzJBVMrOIA39Jq0eQvjuS5umPBmznseqfH28D_J0mjq_w7Ul1nfJ4i9S_kK5iA0QvCxPKQYmjFCg7TqAcM_zHRU1fadPcnJrcQkGK53pmMUIy-QjDe2mFOq8J13bZda8EnWdstLwCsmkCb826KcFg',
          },
        },
        '/auth': {
          target: 'https://api.gamebus.online',
          changeOrigin: true,
          secure: true,
          headers: {
            Cookie:
              'access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImV4cCI6MTc4MTM2NjA3MywiaWF0IjoxNzgxMzU3MDczLCJqdGkiOiI0MzgzMmM2ZS1mZDRkLTRjNGItYTI0ZC0wMzAwNzM0NGExZTIifQ.QhYi2e4x0j09gnhT7OpMmkafe8BirnFK-7NNuedA8QXBzKCtAyz_a9XLBcW7k-JlUyYaMtYkf4EVOnWkNFEz5oHJGQp3OVp7BniKc50p4ukuvv7dA82peOUpCIzbTFPG2LtM_BmFwo_N3HJYthPYHleGhgLFWLPCycGkDfS6yngKBrxeMyCDxkVhsuXjJD8dpLzJBVMrOIA39Jq0eQvjuS5umPBmznseqfH28D_J0mjq_w7Ul1nfJ4i9S_kK5iA0QvCxPKQYmjFCg7TqAcM_zHRU1fadPcnJrcQkGK53pmMUIy-QjDe2mFOq8J13bZda8EnWdstLwCsmkCb826KcFg',
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
