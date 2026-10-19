import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    include: [
      'src/components/GameUI/**/*.test.{ts,tsx}',
      'src/features/{acquire,davinci}/**/*.test.{ts,tsx}',
    ],
    restoreMocks: true,
    clearMocks: true,
  },
});
