import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    include: ['tests/*.test.ts']
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'index.html'),
        privacy: resolve(__dirname, 'privacy/index.html'),
        terms: resolve(__dirname, 'terms/index.html')
      }
    }
  }
});
