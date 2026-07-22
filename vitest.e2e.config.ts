import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
export default defineConfig({
  plugins: [swc.vite()],
  test: {
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    sequence: { concurrent: false },
  },
});
