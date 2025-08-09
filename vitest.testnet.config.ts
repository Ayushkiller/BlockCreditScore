/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/testnet/setup.ts'],
    include: [
      'tests/testnet/**/*.test.ts'
    ],
    exclude: [
      'node_modules',
      'dist',
      'build',
      'tests/unit/**/*',
      'tests/integration/**/*',
      'tests/e2e/**/*'
    ],
    testTimeout: 300000, // 5 minutes for testnet tests
    hookTimeout: 120000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true // Run testnet tests sequentially to avoid conflicts
      }
    },
    retry: 2 // Retry failed testnet tests due to network issues
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