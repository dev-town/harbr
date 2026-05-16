export type ModuleSelector = {
  raw: string
  path: string
  mode: 'children' | 'explicit'
}

export type ProjectConfig = {
  name: string
  repo: string
  modules: ModuleSelector[]
}

export type ResolvedModule = {
  name: string
  path: string
  workspacePath: string
  selector: ModuleSelector
}

export type ProjectScan = {
  projectName: string
  repoPath: string
  workspacePath: string
  modules: ResolvedModule[]
}

export type RepoKind = 'bare' | 'standard'

export type RuntimeScope = 'module' | 'project' | 'workspace'

export type RuntimeStatus = 'open'

export type RuntimeFact = {
  sessionName: string
  scope: RuntimeScope
  projectName: string
  workspaceName: string | null
  moduleName: string | null
  status: RuntimeStatus
}

export type RuntimeIssue = 'tmux_not_found'

export type ProjectObservation = {
  projectName: string
  repoPath: string
  repoKind: RepoKind
  workspaceName: string | null
  workspacePath: string | null
  modules: ResolvedModule[]
  runtimes: RuntimeFact[]
  runtimeIssue: RuntimeIssue | null
}

export type ProjectRecord = {
  id: string
  name: string
  repoPath: string
  repoKind: RepoKind
  createdAt: number
  updatedAt: number
}

export type WorkspaceRecord = {
  id: string
  projectId: string
  name: string
  workspacePath: string
  createdAt: number
  updatedAt: number
}

export type ModuleRecord = {
  id: string
  workspaceId: string
  name: string
  path: string
  selector: ModuleSelector
  createdAt: number
  updatedAt: number
}

export type RuntimeRecord = {
  id: string
  projectId: string
  workspaceId: string | null
  sessionName: string
  scope: RuntimeScope
  modulePath: string | null
  status: RuntimeStatus
  createdAt: number
  updatedAt: number
}

export type SyncProjectResult = {
  projectName: string
  repoPath: string
  repoKind: RepoKind | null
  workspaceName: string | null
  workspacePath: string | null
  moduleCount: number
  runtimeCount: number
  status: 'error' | 'no_workspace' | 'synced'
  errorTag: string | null
  runtimeIssue: RuntimeIssue | null
}

export type SyncResult = {
  projects: SyncProjectResult[]
}
