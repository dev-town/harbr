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

export type RepoInspectionError =
  | RepoNotFoundError
  | RepoNotGitError
  | RepoNotSupportedError
