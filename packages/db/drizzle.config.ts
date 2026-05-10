import { fileURLToPath } from 'node:url'

import { defineConfig } from 'drizzle-kit'

const schemaPath = fileURLToPath(new URL('./src/schema.ts', import.meta.url))
const outPath = fileURLToPath(new URL('./drizzle', import.meta.url))

export default defineConfig({
  dialect: 'sqlite',
  schema: schemaPath,
  out: outPath,
})
