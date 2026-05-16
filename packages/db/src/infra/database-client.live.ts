import { Effect, Layer } from 'effect'

import { DatabaseMigrationError, DatabaseOpenError } from '../db.errors'
import { openDatabase, getDefaultDatabasePath } from '../client'
import { migrateDatabase } from '../migrate'
import type { DatabaseClientApi, HarbourDatabaseConnection } from '../db.types'
import { DatabaseClient } from './database-client.service'

export function makeDatabaseClientLayer(dbPath = getDefaultDatabasePath()) {
  return Layer.scoped(
    DatabaseClient,
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
  )
}

function migrateDatabaseEffect(database: HarbourDatabaseConnection) {
  return Effect.tryPromise({
    try: () => migrateDatabase(database),
    catch: (error) =>
      new DatabaseMigrationError({
        message: error instanceof Error ? error.message : String(error),
      }),
  })
}
