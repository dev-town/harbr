import type { Effect } from 'effect'

import type {
  HarbourContext,
  ActiveRuntimeSummary,
  ModuleSummary,
  ProjectSummary,
  RepoKind,
  ResolvedModule,
  RuntimeFact,
  RuntimeIssue,
  WorkspaceKind,
  WorkspaceSummary,
} from '@harbr/domain'
import type { ProjectServiceError } from '../db.errors'

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
  readonly listActiveRuntimeSummaries: Effect.Effect<
    readonly ActiveRuntimeSummary[],
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
