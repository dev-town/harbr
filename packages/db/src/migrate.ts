import { fileURLToPath } from 'node:url'

import type { HarbourDatabaseConnection } from './db.types'

const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url))

export async function migrateDatabase(database: HarbourDatabaseConnection) {
  if (database.driver === 'bun-sqlite') {
    const { migrate } = await import('drizzle-orm/bun-sqlite/migrator')
    migrate(database.db, { migrationsFolder })
    return
  }

  const { migrate } = await import('drizzle-orm/better-sqlite3/migrator')
  migrate(database.db, { migrationsFolder })
}
