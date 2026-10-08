import { Context, type Effect } from 'effect'

import type { RuntimeDiscovery } from '@harbr/domain'
import type { RuntimeProviderError } from '../runtime.errors'

export type RuntimeDiscoveryServiceApi = {
  readonly listRuntimes: Effect.Effect<RuntimeDiscovery, RuntimeProviderError>
}

export class RuntimeDiscoveryService extends Context.Service<
  RuntimeDiscoveryService,
  RuntimeDiscoveryServiceApi
>()('@harbr/runtime/RuntimeDiscoveryService') {}
