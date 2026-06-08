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
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: true,
          headers: {
            Cookie:
              'access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImV4cCI6MTc4MDkxNTczMywiaWF0IjoxNzgwOTA2NzMzLCJqdGkiOiIyNWI3YjhjZi1hNzk4LTQwYmQtYmQ5Yy0wZTE4NmZjODExNWIifQ.RMId8h50XiqdYeqpGRexVXLGXGceH9w-APNmlY6MjqsIwsX2m21z_NeCAqFVvPl_lctmvcXLvW61_n5La7BugBbAqZd0QtiUA71OhKfUIBNFAyNitVqlz8uHn5qAz2RfH_ef7-c_qGmiDR5yEM8j8j6vbjEnvOT2hYz2kxPmE0BeLVK4DDfvc1qtrA8YztSNIf1AafZOo4vJoIZO1A8NnZs4MgKOw1fRc3U2ToHUO-kZSzi9Ky3qFPveobIOpgDUncvzkjO40kN8hxm8bV3FLE8zl4X4T9ooO2qQ2gzAAsTKRA0W92G-JjTtNLIhQh2wL2Vqs4EYkPY5f01oVFNWgw',
          },
        },
        '/auth': {
          target: 'https://api.gamebus.online',
          changeOrigin: true,
          secure: true,
          headers: {
            Cookie:
              'access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImV4cCI6MTc4MDkxNTczMywiaWF0IjoxNzgwOTA2NzMzLCJqdGkiOiIyNWI3YjhjZi1hNzk4LTQwYmQtYmQ5Yy0wZTE4NmZjODExNWIifQ.RMId8h50XiqdYeqpGRexVXLGXGceH9w-APNmlY6MjqsIwsX2m21z_NeCAqFVvPl_lctmvcXLvW61_n5La7BugBbAqZd0QtiUA71OhKfUIBNFAyNitVqlz8uHn5qAz2RfH_ef7-c_qGmiDR5yEM8j8j6vbjEnvOT2hYz2kxPmE0BeLVK4DDfvc1qtrA8YztSNIf1AafZOo4vJoIZO1A8NnZs4MgKOw1fRc3U2ToHUO-kZSzi9Ky3qFPveobIOpgDUncvzkjO40kN8hxm8bV3FLE8zl4X4T9ooO2qQ2gzAAsTKRA0W92G-JjTtNLIhQh2wL2Vqs4EYkPY5f01oVFNWgw',
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
