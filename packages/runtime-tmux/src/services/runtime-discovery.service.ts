import { Context, type Effect } from 'effect'

import type { TmuxError } from '../runtime-tmux.errors'
import type { RuntimeDiscovery } from '../runtime-tmux.types'

export type RuntimeDiscoveryServiceApi = {
  readonly listRuntimes: Effect.Effect<RuntimeDiscovery, TmuxError>
}

export class RuntimeDiscoveryService extends Context.Tag(
  '@harbr/runtime-tmux/RuntimeDiscoveryService',
)<RuntimeDiscoveryService, RuntimeDiscoveryServiceApi>() {}
