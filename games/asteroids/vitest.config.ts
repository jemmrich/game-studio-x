import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@engine/': path.resolve(__dirname, '../../engine/src/') + '/',
      '@shared/': path.resolve(__dirname, '../../shared/src/') + '/',
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec,bench}.ts'],
  },
});
