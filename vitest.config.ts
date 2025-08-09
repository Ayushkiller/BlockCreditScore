/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/unit/**/*.test.ts',
      'services/**/tests/**/*.test.ts',
      'contracts/tests/**/*.test.ts'
    ],
    exclude: [
      'node_modules',
      'dist',
      'build',
      'tests/integration/**/*',
      'tests/e2e/**/*'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        'build/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/types/**'
      ]
    },
    testTimeout: 30000,
    hookTimeout: 30000
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