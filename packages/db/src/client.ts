/// <reference path="./sqlite-shims.d.ts" />

import { mkdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

import * as schema from './schema'
import type { HarbourDatabaseConnection } from './db.types'

export async function openDatabase(dbPath: string) {
  await mkdir(path.dirname(dbPath), { recursive: true })

  try {
    const [{ Database }, { drizzle }] = await Promise.all([
      importBunSqlite(),
      import('drizzle-orm/bun-sqlite'),
    ])

    const sqlite = new Database(dbPath, { create: true, strict: true })
    sqlite.exec('PRAGMA foreign_keys = ON;')
    sqlite.exec('PRAGMA journal_mode = WAL;')

    return {
      driver: 'bun-sqlite',
      sqlite,
      db: drizzle(sqlite, { schema }),
    } satisfies HarbourDatabaseConnection
  } catch {
    const [{ default: Database }, { drizzle }] = await Promise.all([
      importBetterSqlite3(),
      import('drizzle-orm/better-sqlite3'),
    ])

    const sqlite = new Database(dbPath)
    sqlite.pragma('foreign_keys = ON')
    sqlite.pragma('journal_mode = WAL')

    return {
      driver: 'better-sqlite3',
      sqlite,
      db: drizzle(sqlite, { schema }),
    } satisfies HarbourDatabaseConnection
  }
}

export function getDefaultDatabasePath() {
  return path.join(homedir(), '.local', 'share', 'harbour', 'harbour.db')
}

function importBunSqlite() {
  return import('bun:sqlite') as Promise<{
    Database: new (
      filename: string,
      options?: {
        create?: boolean
        strict?: boolean
      },
    ) => {
      close(): void
      exec(sql: string): unknown
    }
  }>
}

function importBetterSqlite3() {
  return import('better-sqlite3') as Promise<{
    default: new (filename: string) => {
      close(): void
      pragma(statement: string): unknown
    }
  }>
}
