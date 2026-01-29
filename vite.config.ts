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
          target: 'https://api.gamebus.online',
          changeOrigin: true,
          secure: true,
          headers: {
            Cookie: 'access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImV4cCI6MTc2OTY5MTEzNiwiaWF0IjoxNzY5NjkwMjM2LCJqdGkiOiJjMTIxMjUzNC1lM2UxLTQzMjMtYjQyZC00MjA2NDIwYmEzOTAifQ.gWYCHyQbsUX5D2TE8u7Q1pH09XxSiGsudXU3drECcJgH9RCbD7FXsN-QouYyi_tfpD33daw6s0cdTJTu1WlGXBJz7JUIJOcQvfFH-YgFh7_phYoK40-COSDqsip9tIZ-9tk-VCj5SDwl8TvM9mDlb5g_PcALkTTs387Qf5LERvoRwM2q6oNSwGmguOHODkayr-tjugt4tgZyCm17CIyFgQmLgbIjUQ4GU7sTwFmd3wpvrGReN1mJ4d6A_Yl9uceq43fEN6LHwJSKZrcQ0WhHM_0v44KD3e-nSg0Xw-baHP-HRCwp3ZzGa1IM_1s5tLyw3amH1riDBNo8Es_8N-bdKQ',
          },
        },
        '/auth': {
          target: 'https://api.gamebus.online',
          changeOrigin: true,
          secure: true,
          headers: {
            Cookie: 'access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImV4cCI6MTc2OTY5MTEzNiwiaWF0IjoxNzY5NjkwMjM2LCJqdGkiOiJjMTIxMjUzNC1lM2UxLTQzMjMtYjQyZC00MjA2NDIwYmEzOTAifQ.gWYCHyQbsUX5D2TE8u7Q1pH09XxSiGsudXU3drECcJgH9RCbD7FXsN-QouYyi_tfpD33daw6s0cdTJTu1WlGXBJz7JUIJOcQvfFH-YgFh7_phYoK40-COSDqsip9tIZ-9tk-VCj5SDwl8TvM9mDlb5g_PcALkTTs387Qf5LERvoRwM2q6oNSwGmguOHODkayr-tjugt4tgZyCm17CIyFgQmLgbIjUQ4GU7sTwFmd3wpvrGReN1mJ4d6A_Yl9uceq43fEN6LHwJSKZrcQ0WhHM_0v44KD3e-nSg0Xw-baHP-HRCwp3ZzGa1IM_1s5tLyw3amH1riDBNo8Es_8N-bdKQ',
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
