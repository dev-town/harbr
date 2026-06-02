import type { Effect } from 'effect'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'

import type {
  HarbourContext,
  ModuleSummary,
  ProjectSummary,
  RepoKind,
  ResolvedModule,
  RuntimeFact,
  RuntimeIssue,
  WorkspaceKind,
  WorkspaceSummary,
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

export type WorkspaceSnapshotInput = {
  branchName?: string | null | undefined
  workspaceName: string
  workspacePath: string
  kind: WorkspaceKind
  modules: ResolvedModule[]
}

export type ReplaceProjectSnapshotInput = {
  projectName: string
  projectIssue?: string | null
  repoPath: string
  repoKind: RepoKind
  workspaces: WorkspaceSnapshotInput[]
  runtimes: RuntimeFact[]
  runtimeIssue: RuntimeIssue | null
}

export type ProjectRecord = {
  createdAt: number
  id: string
  name: string
  projectIssue?: string | null
  repoKind: RepoKind
  repoPath: string
  updatedAt: number
}

export type WorkspaceRecord = {
  branchName?: string | null
  createdAt: number
  id: string
  kind: WorkspaceKind
  name: string
  projectId: string
  updatedAt: number
  workspacePath: string
}

export type ModuleRecord = {
  createdAt: number
  id: string
  name: string
  path: string
  selector: ResolvedModule['selector']
  updatedAt: number
  workspaceId: string
}

export type RuntimeRecord = {
  createdAt: number
  id: string
  modulePath: string | null
  projectId: string
  scope: RuntimeFact['scope']
  sessionName: string
  status: RuntimeFact['status']
  updatedAt: number
  workspaceId: string | null
}

export type ProjectSnapshot = {
  project: ProjectRecord
  workspaces: WorkspaceRecord[]
  modules: ModuleRecord[]
  runtimes: RuntimeRecord[]
}

export type ProjectServiceApi = {
  readonly findByName: (
    projectName: string,
  ) => Effect.Effect<ProjectRecord | null, ProjectServiceError>
  readonly loadUiContext: Effect.Effect<HarbourContext, ProjectServiceError>
  readonly listProjectSummaries: Effect.Effect<
    readonly ProjectSummary[],
    ProjectServiceError
  >
  readonly listWorkspaceSummaries: (
    projectId: string,
  ) => Effect.Effect<readonly WorkspaceSummary[], ProjectServiceError>
  readonly listModuleSummaries: (
    workspaceId: string,
  ) => Effect.Effect<readonly ModuleSummary[], ProjectServiceError>
  readonly saveUiContext: (
    context: HarbourContext,
  ) => Effect.Effect<HarbourContext, ProjectServiceError>
  readonly syncSnapshot: (
    input: ReplaceProjectSnapshotInput,
  ) => Effect.Effect<ProjectSnapshot, ProjectServiceError>
}
