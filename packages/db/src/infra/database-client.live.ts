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

export const DatabaseClientLive = Layer.scoped(
  DatabaseClient,
  Effect.flatMap(DatabaseClientOptions, ({ dbPath }) =>
    Effect.acquireRelease(
      Effect.gen(function* () {
        const database = yield* Effect.tryPromise({
          try: () => openDatabase(dbPath),
          catch: (error) =>
            new DatabaseOpenError({
              dbPath,
              message: error instanceof Error ? error.message : String(error),
            }),
        })

        yield* migrateDatabaseEffect(database)

        return database
      }),
      (database) => Effect.sync(() => database.sqlite.close()),
    ).pipe(
      Effect.map(
        (database) =>
          ({
            db: database.db,
            migrate: migrateDatabaseEffect(database),
          }) satisfies DatabaseClientApi,
      ),
    ),
  ),
)

function migrateDatabaseEffect(database: HarbourDatabaseConnection) {
  return Effect.tryPromise({
    try: () => migrateDatabase(database),
    catch: (error) =>
      new DatabaseMigrationError({
        message: error instanceof Error ? error.message : String(error),
      }),
  })
}
