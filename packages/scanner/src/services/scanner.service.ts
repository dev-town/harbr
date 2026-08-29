import { Context, type Effect, type Either } from 'effect'

import type { ProjectConfig, ProjectObservation } from '@harbr/domain'
import type { RepoInspectionError, RepoNotGitError } from '@harbr/git'
import type { RuntimeProviderError } from '@harbr/runtime/discovery'

export type ScannerError =
  | RepoInspectionError
  | RepoNotGitError
  | RuntimeProviderError

export type ProjectObservationResult = {
  readonly project: ProjectConfig
  readonly result: Either.Either<ProjectObservation, ScannerError>
}

export type ScannerServiceApi = {
  readonly observeProjects: (
    projects: readonly ProjectConfig[],
  ) => Effect.Effect<readonly ProjectObservationResult[], RuntimeProviderError>
  readonly observeProject: (
    project: ProjectConfig,
  ) => Effect.Effect<ProjectObservation, ScannerError>
}

export class ScannerService extends Context.Tag(
  '@harbr/scanner/ScannerService',
)<ScannerService, ScannerServiceApi>() {}
