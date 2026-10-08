import { Context, type Effect, type Result } from 'effect'

import type { ProjectConfig, ProjectObservation } from '@harbr/domain'
import type { RepoInspectionError, RepoNotGitError } from '@harbr/git'
import type { RuntimeProviderError } from '@harbr/runtime/discovery'

export type ScannerError = RepoInspectionError | RepoNotGitError | RuntimeProviderError

export type ProjectObservationResult = {
  readonly project: ProjectConfig
  readonly result: Result.Result<ProjectObservation, ScannerError>
}

export type ScannerServiceApi = {
  readonly observeProjects: (
    projects: readonly ProjectConfig[],
  ) => Effect.Effect<readonly ProjectObservationResult[], RuntimeProviderError>
  readonly observeProject: (
    project: ProjectConfig,
  ) => Effect.Effect<ProjectObservation, ScannerError>
}

export class ScannerService extends Context.Service<ScannerService, ScannerServiceApi>()(
  '@harbr/scanner/ScannerService',
) {}
