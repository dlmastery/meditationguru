import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'src/hooks/**/*.ts'],
      exclude: [
        'src/lib/firebase.ts',
        'src/lib/gemini.ts',
        'src/lib/persistence.ts',
        'src/lib/gemini-enhanced.ts',
      ],
    },
  },
});
