#!/usr/bin/env bun

import { access, rm } from 'node:fs/promises'

const target = `bun-${process.platform}-${process.arch}`
const outfile = './dist/harbr'

await rm('./dist', { force: true, recursive: true })

const result = await Bun.build({
  conditions: ['node'],
  entrypoints: ['./src/index.tsx'],
  format: 'esm',
  minify: true,
  target: 'bun',
  compile: {
    autoloadBunfig: false,
    autoloadDotenv: false,
    autoloadPackageJson: true,
    autoloadTsconfig: true,
    outfile,
    target,
  },
})

if (!result.success) {
  for (const log of result.logs) {
    console.error(log)
  }

  process.exit(1)
}

try {
  await access(outfile)
} catch {
  console.error(
    `Build completed without emitting ${outfile}. Update Bun and retry.`,
  )
  process.exit(1)
}
