import { Context, type Effect } from 'effect'

import type { CurrentRuntime, RuntimeDiscovery } from '../runtime-tmux.types'
import type { TmuxError } from '../runtime-tmux.errors'

export type RuntimeTmuxServiceApi = {
  readonly getCurrentRuntime: Effect.Effect<CurrentRuntime, TmuxError>
  readonly listRuntimes: Effect.Effect<RuntimeDiscovery, TmuxError>
}

export class RuntimeTmuxService extends Context.Tag(
  '@harbour/runtime-tmux/RuntimeTmuxService',
)<RuntimeTmuxService, RuntimeTmuxServiceApi>() {}
