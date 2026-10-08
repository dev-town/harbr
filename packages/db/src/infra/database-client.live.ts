import { Effect, Layer } from 'effect'

import { DatabaseMigrationError, DatabaseOpenError } from '../db.errors'
import { openDatabase, getDefaultDatabasePath } from '../client'
import { migrateDatabase } from '../migrate'
import type { DatabaseClientApi, HarbourDatabaseConnection } from '../db.types'
import {
  DatabaseClient,
  DatabaseClientOptions,
} from './database-client.service'

export const DatabaseClientOptionsLive = Layer.succeed(DatabaseClientOptions, {
  dbPath: getDefaultDatabasePath(),
})

export const DatabaseClientLive = Layer.effect(
  DatabaseClient,
  Effect.gen(function* () {
    const { dbPath } = yield* DatabaseClientOptions
    const database = yield* Effect.acquireRelease(
      Effect.tryPromise({
        try: () => openDatabase(dbPath),
        catch: (error) =>
          new DatabaseOpenError({
            dbPath,
            message: error instanceof Error ? error.message : String(error),
          }),
      }).pipe(
        Effect.withSpan('db.open', { attributes: { 'db.path': dbPath } }),
      ),
      (database) => Effect.sync(() => database.sqlite.close()),
    )

    yield* migrateDatabaseEffect(database)

    return {
      db: database.db,
      migrate: migrateDatabaseEffect(database),
    } satisfies DatabaseClientApi
  }),
)

function migrateDatabaseEffect(database: HarbourDatabaseConnection) {
  return Effect.tryPromise({
    try: () => migrateDatabase(database),
    catch: (error) =>
      new DatabaseMigrationError({
        message: error instanceof Error ? error.message : String(error),
      }),
  }).pipe(Effect.withSpan('db.migrate'))
}
