import { Cause, Effect, Exit, Layer } from 'effect'
import { describe, expect, it, vi } from 'vitest'

const close = vi.hoisted(() => vi.fn())

vi.mock('../client', () => ({
  getDefaultDatabasePath: () => '/tmp/harbr-layer-test.sqlite',
  openDatabase: async () => ({
    db: {},
    driver: 'better-sqlite3',
    sqlite: { close },
  }),
}))

vi.mock('../migrate', () => ({
  migrateDatabase: async () => {
    throw new Error('migration failed')
  },
}))

import { DatabaseMigrationError } from '../db.errors'
import { DatabaseClientLive } from './database-client.live'
import { DatabaseClient, DatabaseClientOptions } from './database-client.service'

describe('DatabaseClientLive', () => {
  it('closes the connection when migration fails during layer construction', async () => {
    close.mockClear()

    const result = await Effect.runPromiseExit(
      DatabaseClient.pipe(
        Effect.provide(
          DatabaseClientLive.pipe(
            Layer.provide(
              Layer.succeed(DatabaseClientOptions, {
                dbPath: '/tmp/harbr-layer-test.sqlite',
              }),
            ),
          ),
        ),
      ),
    )

    expect(Exit.isFailure(result)).toBe(true)
    if (Exit.isFailure(result)) {
      expect(Cause.squash(result.cause)).toBeInstanceOf(DatabaseMigrationError)
    }
    expect(close).toHaveBeenCalledOnce()
  })
})
