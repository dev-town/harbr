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

export type ProjectObservation = {
  projectName: string
  repoPath: string
  repoKind: RepoKind
  workspacePath: string | null
  modules: ResolvedModule[]
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

export type SyncProjectResult = {
  projectName: string
  repoPath: string
  repoKind: RepoKind | null
  workspacePath: string | null
  moduleCount: number
  status: 'error' | 'no_workspace' | 'synced'
  errorTag: string | null
}

export type SyncResult = {
  projects: SyncProjectResult[]
}
