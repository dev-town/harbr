import { Context, type Effect } from 'effect'

import type { ProjectServiceError } from '@harbr/db'
import type {
  ProjectConfig,
  SyncProjectResult,
  SyncResult,
} from '@harbr/domain'
import type { ScannerError } from '@harbr/scanner'

export type ReconcilerError = ScannerError | ProjectServiceError

export type ReconcilerServiceApi = {
  readonly syncProjects: (
    projects: readonly ProjectConfig[],
  ) => Effect.Effect<SyncResult, ReconcilerError>
  readonly refreshProject: (
    project: ProjectConfig,
  ) => Effect.Effect<SyncProjectResult, ReconcilerError>
}

export class ReconcilerService extends Context.Tag(
  '@harbr/reconciler/ReconcilerService',
)<ReconcilerService, ReconcilerServiceApi>() {}
