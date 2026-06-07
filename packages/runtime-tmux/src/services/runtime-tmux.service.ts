import { Context, type Effect } from 'effect'

import type {
  CreateRuntimeWindowsResult,
  CurrentRuntime,
  RuntimeDiscovery,
  RuntimeTarget,
  RuntimeWindowCreation,
} from '../runtime-tmux.types'
import type { TmuxError } from '../runtime-tmux.errors'

export type RuntimeTmuxServiceApi = {
  readonly closeRuntime: (sessionName: string) => Effect.Effect<void, TmuxError>
  readonly createRuntimeWindows: (
    input: RuntimeWindowCreation,
  ) => Effect.Effect<CreateRuntimeWindowsResult, TmuxError>
  readonly getCurrentRuntime: Effect.Effect<CurrentRuntime, TmuxError>
  readonly listRuntimes: Effect.Effect<RuntimeDiscovery, TmuxError>
  readonly openOrCreateRuntime: (
    target: RuntimeTarget,
  ) => Effect.Effect<void, TmuxError>
}

export class RuntimeTmuxService extends Context.Tag(
  '@harbour/runtime-tmux/RuntimeTmuxService',
)<RuntimeTmuxService, RuntimeTmuxServiceApi>() {}
