/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/integration/setup.ts'],
    include: [
      'tests/integration/**/*.test.ts'
    ],
    exclude: [
      'node_modules',
      'dist',
      'build',
      'tests/unit/**/*',
      'tests/e2e/**/*'
    ],
    testTimeout: 120000, // 2 minutes for integration tests
    hookTimeout: 60000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true // Run integration tests sequentially
      }
    }
  },
  resolve: {
    alias: {
      '@types': resolve(__dirname, './types'),
      '@contracts': resolve(__dirname, './contracts'),
      '@services': resolve(__dirname, './services'),
      '@frontend': resolve(__dirname, './frontend'),
      '@config': resolve(__dirname, './config'),
      '@utils': resolve(__dirname, './utils'),
      '@tests': resolve(__dirname, './tests')
    }
  }
});