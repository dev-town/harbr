import type { Effect } from 'effect'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'

import type * as schema from './schema'
import type { DatabaseMigrationError } from './db.errors'

export type HarbourDatabase =
  | BetterSQLite3Database<typeof schema>
  | BunSQLiteDatabase<typeof schema>

export type HarbourDatabaseConnection = {
  driver: 'better-sqlite3' | 'bun-sqlite'
  sqlite: { close(): void }
  db: HarbourDatabase
}

export type DatabaseClientApi = {
  readonly db: HarbourDatabase
  readonly migrate: Effect.Effect<void, DatabaseMigrationError>
}
