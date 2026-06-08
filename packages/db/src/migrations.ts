import crypto from 'node:crypto'

import type { MigrationMeta } from 'drizzle-orm/migrator'

import { embeddedMigrationSources } from './migrations.gen'

export function getEmbeddedMigrations(): MigrationMeta[] {
  return embeddedMigrationSources.map((migration) => ({
    bps: migration.breakpoints,
    folderMillis: migration.when,
    hash: crypto.createHash('sha256').update(migration.sql).digest('hex'),
    sql: migration.sql.split('--> statement-breakpoint'),
  }))
}
