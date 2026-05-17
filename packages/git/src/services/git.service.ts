import { Context, type Effect } from 'effect'
import type { RepoNotGitError, RepoInspectionError } from '../git.errors'
import type { RepoInspection, WorkspaceTarget } from '../git.types'

export type GitServiceApi = {
  readonly inspectRepo: (
    repoPath: string,
  ) => Effect.Effect<RepoInspection, RepoInspectionError>
  readonly listWorkspaces: (
    repo: RepoInspection,
  ) => Effect.Effect<WorkspaceTarget[], RepoNotGitError>
  readonly resolveWorkspacePath: (
    repo: RepoInspection,
  ) => Effect.Effect<string | null, RepoNotGitError>
}

export class GitService extends Context.Tag('@harbour/git/GitService')<
  GitService,
  GitServiceApi
>() {}
