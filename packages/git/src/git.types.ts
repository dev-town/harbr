export type RepoKind = 'bare' | 'standard'

export type RepoInspection = {
  repoPath: string
  kind: RepoKind
}

export type WorkspaceTarget = {
  name: string
  path: string
  kind: 'default' | 'worktree'
}
