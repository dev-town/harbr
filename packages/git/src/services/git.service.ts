import { Context, type Effect } from 'effect'
import type {
  RepoNotGitError,
  RepoInspectionError,
  WorktreeMutationError,
} from '../git.errors'
import type { CreateWorktreeInput, RepoInspection, WorkspaceTarget } from '../git.types'

export type GitServiceApi = {
  readonly getDefaultBranchIssue: (
    repo: RepoInspection,
  ) => Effect.Effect<string | null, RepoNotGitError>
  readonly inspectRepo: (
    repoPath: string,
  ) => Effect.Effect<RepoInspection, RepoInspectionError>
  readonly getDefaultBranch: (
    repo: RepoInspection,
  ) => Effect.Effect<string, WorktreeMutationError>
  readonly listWorkspaces: (
    repo: RepoInspection,
  ) => Effect.Effect<WorkspaceTarget[], RepoNotGitError>
  readonly createWorktree: (
    repo: RepoInspection,
    input: CreateWorktreeInput,
  ) => Effect.Effect<WorkspaceTarget, WorktreeMutationError>
  readonly resolveWorkspacePath: (
    repo: RepoInspection,
  ) => Effect.Effect<string | null, RepoNotGitError>
}

export class GitService extends Context.Tag('@harbour/git/GitService')<
  GitService,
  GitServiceApi
>() {}
