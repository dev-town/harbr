import { Context, type Effect } from 'effect'
import type { RepoNotGitError, RepoInspectionError } from '../git.errors'
import type { RepoInspection } from '../git.types'

export type GitServiceApi = {
  readonly inspectRepo: (
    repoPath: string,
  ) => Effect.Effect<RepoInspection, RepoInspectionError>
  readonly resolveWorkspacePath: (
    repo: RepoInspection,
  ) => Effect.Effect<string | null, RepoNotGitError>
}

export class GitService extends Context.Tag('@harbour/git/GitService')<
  GitService,
  GitServiceApi
>() {}
