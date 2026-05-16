export type RepoKind = 'bare' | 'standard'

export type RepoInspection = {
  repoPath: string
  kind: RepoKind
}
