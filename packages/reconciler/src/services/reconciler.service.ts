import { Context, type Effect } from 'effect'

import type { HarbourConfigError } from '@harbr/config'
import type { ProjectServiceError } from '@harbr/db'
import type { SyncProjectResult, SyncResult } from '@harbr/domain'
import type { ScannerError } from '@harbr/scanner'
import type { ProjectNotFoundError } from '../reconciler.errors'

export type ReconcilerError =
  | HarbourConfigError
  | ScannerError
  | ProjectServiceError
  | ProjectNotFoundError

export type ReconcilerServiceApi = {
  readonly sync: Effect.Effect<SyncResult, ReconcilerError>
  readonly refreshProject: (
    projectName: string,
  ) => Effect.Effect<SyncProjectResult, ReconcilerError>
}

export class ReconcilerService extends Context.Tag(
  '@harbr/reconciler/ReconcilerService',
)<ReconcilerService, ReconcilerServiceApi>() {}
