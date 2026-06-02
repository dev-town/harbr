export type RepoKind = 'bare' | 'standard'

export type RepoInspection = {
  repoPath: string
  kind: RepoKind
}

export type CreateWorktreeInput = {
  branchName: string
  workspaceName: string
}

export type WorkspaceTarget = {
  branchName: string | null
  name: string
  path: string
  kind: 'default' | 'worktree'
}
