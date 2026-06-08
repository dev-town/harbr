#!/usr/bin/env bun

import fs from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { format } from 'prettier'

const packageRoot = path.resolve(import.meta.dirname, '..')
const drizzleDir = path.join(packageRoot, 'drizzle')
const journalPath = path.join(drizzleDir, 'meta', '_journal.json')
const migrationsDir = path.join(packageRoot, 'src', 'migrations')
const registryPath = path.join(packageRoot, 'src', 'migrations.gen.ts')

const args = parseArgs({
  args: process.argv.slice(2),
  options: {
    check: { type: 'boolean' },
  },
})

const journal = JSON.parse(await Bun.file(journalPath).text()) as {
  entries: Array<{
    breakpoints: boolean
    tag: string
    when: number
  }>
}

const expectedFiles = new Map<string, string>()

for (const entry of journal.entries) {
  const migrationPath = path.join(drizzleDir, `${entry.tag}.sql`)
  const sql = await Bun.file(migrationPath).text()
  expectedFiles.set(
    path.join(migrationsDir, `${entry.tag}.ts`),
    await formatTypeScript(renderMigration(entry, sql)),
  )
}

expectedFiles.set(
  registryPath,
  await formatTypeScript(
    renderRegistry(journal.entries.map((entry) => entry.tag)),
  ),
)

if (args.values.check) {
  await check(expectedFiles)
  process.exit(0)
}

await fs.mkdir(migrationsDir, { recursive: true })
for (const [filePath, contents] of expectedFiles) {
  await Bun.write(filePath, contents)
}

async function check(files: Map<string, string>) {
  for (const [filePath, expected] of files) {
    const current = await Bun.file(filePath)
      .text()
      .catch(() => null)

    if (current !== expected) {
      throw new Error(
        `Database migration wrapper is stale: ${path.relative(packageRoot, filePath)}. Run bun run db:migration.`,
      )
    }
  }
}

function renderMigration(
  entry: { breakpoints: boolean; tag: string; when: number },
  sql: string,
) {
  return `import type { EmbeddedMigrationSource } from '../migrations.types'

export default {
  breakpoints: ${JSON.stringify(entry.breakpoints)},
  sql: ${JSON.stringify(sql)},
  tag: ${JSON.stringify(entry.tag)},
  when: ${JSON.stringify(entry.when)},
} satisfies EmbeddedMigrationSource
`
}

function renderRegistry(tags: string[]) {
  return `import type { EmbeddedMigrationSource } from './migrations.types'

export const embeddedMigrationSources = (
  await Promise.all([
${tags.map((tag) => `    import('./migrations/${tag}'),`).join('\n')}
  ])
).map((module) => module.default) satisfies EmbeddedMigrationSource[]
`
}

async function formatTypeScript(contents: string) {
  return format(contents, {
    parser: 'typescript',
    semi: false,
    singleQuote: true,
  })
}
