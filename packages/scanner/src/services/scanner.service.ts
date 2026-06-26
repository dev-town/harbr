import { Context, type Effect, type Either } from 'effect'

import type { ProjectConfig, ProjectObservation } from '@harbr/domain'
import type { RepoInspectionError, RepoNotGitError } from '@harbr/git'
import type { TmuxError } from '@harbr/runtime-tmux/discovery'

export type ScannerError = RepoInspectionError | RepoNotGitError | TmuxError

export type ProjectObservationResult = {
  readonly project: ProjectConfig
  readonly result: Either.Either<ProjectObservation, ScannerError>
}

export type ScannerServiceApi = {
  readonly observeProjects: (
    projects: readonly ProjectConfig[],
  ) => Effect.Effect<readonly ProjectObservationResult[], TmuxError>
  readonly observeProject: (
    project: ProjectConfig,
  ) => Effect.Effect<ProjectObservation, ScannerError>
}

export class ScannerService extends Context.Tag(
  '@harbr/scanner/ScannerService',
)<ScannerService, ScannerServiceApi>() {}
