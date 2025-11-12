import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    coverage: {
      provider: 'v8',               // ✅ required for @vitest/coverage-v8
      reportsDirectory: './coverage', // ✅ where reports will be saved
      reporter: ['text', 'html', 'lcov'], // ✅ output formats
    },
  },
})
