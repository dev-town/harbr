import { Data } from 'effect'

export class RepoNotFoundError extends Data.TaggedError('RepoNotFoundError')<{
  repoPath: string
}> {}

export class RepoNotGitError extends Data.TaggedError('RepoNotGitError')<{
  repoPath: string
}> {}

export class RepoNotSupportedError extends Data.TaggedError(
  'RepoNotSupportedError',
)<{
  repoPath: string
}> {}

export class DefaultBranchNotFoundError extends Data.TaggedError(
  'DefaultBranchNotFoundError',
)<{
  message: string
  repoPath: string
}> {}

export class InvalidBranchNameError extends Data.TaggedError(
  'InvalidBranchNameError',
)<{
  branchName: string
}> {}

export class WorktreeCreateError extends Data.TaggedError(
  'WorktreeCreateError',
)<{
  message: string
  repoPath: string
}> {}

export type RepoInspectionError =
  | RepoNotFoundError
  | RepoNotGitError
  | RepoNotSupportedError

export type WorktreeMutationError =
  | DefaultBranchNotFoundError
  | InvalidBranchNameError
  | RepoNotGitError
  | WorktreeCreateError
