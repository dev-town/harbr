import { Context, type Effect } from 'effect'

import type { HarbourConfigError } from '@harbour/config'
import type { ProjectServiceError } from '@harbour/db'
import type { SyncProjectResult, SyncResult } from '@harbour/domain'
import type { ScannerError } from '@harbour/scanner'
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
  '@harbour/reconciler/ReconcilerService',
)<ReconcilerService, ReconcilerServiceApi>() {}
