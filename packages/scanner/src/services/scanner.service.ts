import { Context, type Effect } from 'effect'

import type { ProjectConfig, ProjectObservation } from '@harbr/domain'
import type { RepoInspectionError, RepoNotGitError } from '@harbr/git'
import type { TmuxError } from '@harbr/runtime-tmux'

export type ScannerError = RepoInspectionError | RepoNotGitError | TmuxError

export type ScannerServiceApi = {
  readonly observeProject: (
    project: ProjectConfig,
  ) => Effect.Effect<ProjectObservation, ScannerError>
}

export class ScannerService extends Context.Tag(
  '@harbr/scanner/ScannerService',
)<ScannerService, ScannerServiceApi>() {}
