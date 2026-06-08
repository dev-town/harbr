import type { MigrationMeta } from 'drizzle-orm/migrator'

import type { HarbourDatabase, HarbourDatabaseConnection } from './db.types'
import { getEmbeddedMigrations } from './migrations'

type MigratableDatabase = HarbourDatabase & {
  dialect: {
    migrate(
      migrations: MigrationMeta[],
      session: unknown,
      config?: { migrationsTable?: string },
    ): void
  }
  session: unknown
}

export async function migrateDatabase(database: HarbourDatabaseConnection) {
  const db = database.db as MigratableDatabase
  db.dialect.migrate(getEmbeddedMigrations(), db.session)
}
