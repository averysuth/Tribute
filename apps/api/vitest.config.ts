import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
    // Tests share fixture users and a real dev database; running files in
    // parallel risks slug/role races between files, so keep them sequential.
    fileParallelism: false,
  },
});
