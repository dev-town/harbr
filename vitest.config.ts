import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/.turbo/**',
      '**/dist/**',
      '**/coverage/**',
      'vendor/**',
    ],
  },
})
