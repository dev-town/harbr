import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./apps/tui/src', import.meta.url)),
    },
  },
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
