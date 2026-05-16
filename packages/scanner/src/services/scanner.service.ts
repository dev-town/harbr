import { Context, type Effect } from 'effect'

import type { ProjectConfig, ProjectObservation } from '@harbour/domain'
import type { RepoInspectionError, RepoNotGitError } from '@harbour/git'

export type ScannerError = RepoInspectionError | RepoNotGitError

export type ScannerServiceApi = {
  readonly observeProject: (
    project: ProjectConfig,
  ) => Effect.Effect<ProjectObservation, ScannerError>
}

export class ScannerService extends Context.Tag(
  '@harbour/scanner/ScannerService',
)<ScannerService, ScannerServiceApi>() {}
