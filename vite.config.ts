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
        '/room': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: true,
          headers: {
            Cookie: 'access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImV4cCI6MTc3MDkwMDY1OCwiaWF0IjoxNzcwMjk1ODU4LCJqdGkiOiI4OTE5ZTk1Zi04MWMzLTQ0N2ItYWQzNS1hMzIwODRmYWU0ZTMifQ.ZHfteZtEgAYFdymIYh1_9U7TT758ZLl7C4xna-9pGB3EBLE-6GXpzQurXMuw5Q2L5L8hGLKFQNcZL0CIKBACW3m3pXfiouLUIAPRBD0e1a2OKIZqRVE8j4aVvlqfQY-H4BIsa1LnvqEmtbu7kW0Z7Mn7262rlPQ23uPD9mlokRm0H20NM-p3OV66bn-DdL4Mw-I2_5OcIThbX3xOgZvsAEp6fGedL1cMdv7zeqf5aR0FemLzW8YM9q6_GCN82LljuqN1TmlLJzUYTNBRV7PhTNUS60ba22zY36TWkAaqVyVkjJC8MEtyPCxMd-yOBCcptSOM1B9W_Fa_ELAcnF0-kA',
          },
        },
        '/auth': {
          target: 'https://api.gamebus.online',
          changeOrigin: true,
          secure: true,
          headers: {
            Cookie: 'access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImV4cCI6MTc3MDkwMDY1OCwiaWF0IjoxNzcwMjk1ODU4LCJqdGkiOiI4OTE5ZTk1Zi04MWMzLTQ0N2ItYWQzNS1hMzIwODRmYWU0ZTMifQ.ZHfteZtEgAYFdymIYh1_9U7TT758ZLl7C4xna-9pGB3EBLE-6GXpzQurXMuw5Q2L5L8hGLKFQNcZL0CIKBACW3m3pXfiouLUIAPRBD0e1a2OKIZqRVE8j4aVvlqfQY-H4BIsa1LnvqEmtbu7kW0Z7Mn7262rlPQ23uPD9mlokRm0H20NM-p3OV66bn-DdL4Mw-I2_5OcIThbX3xOgZvsAEp6fGedL1cMdv7zeqf5aR0FemLzW8YM9q6_GCN82LljuqN1TmlLJzUYTNBRV7PhTNUS60ba22zY36TWkAaqVyVkjJC8MEtyPCxMd-yOBCcptSOM1B9W_Fa_ELAcnF0-kA',
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
