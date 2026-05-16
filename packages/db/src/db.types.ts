import type { Effect } from 'effect'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'

import type {
  ModuleRecord,
  ProjectRecord,
  RepoKind,
  ResolvedModule,
  WorkspaceRecord,
} from '@harbour/domain'
import type * as schema from './schema'
import type {
  DatabaseMigrationError,
  ProjectServiceError,
} from './db.errors'

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

export type ReplaceProjectSnapshotInput = {
  projectName: string
  repoPath: string
  repoKind: RepoKind
  workspacePath: string | null
  modules: ResolvedModule[]
}

export type ProjectSnapshot = {
  project: ProjectRecord
  workspace: WorkspaceRecord | null
  modules: ModuleRecord[]
}

export type ProjectServiceApi = {
  readonly findByName: (
    projectName: string,
  ) => Effect.Effect<ProjectRecord | null, ProjectServiceError>
  readonly syncSnapshot: (
    input: ReplaceProjectSnapshotInput,
  ) => Effect.Effect<ProjectSnapshot, ProjectServiceError>
}
