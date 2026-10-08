import { Context, type Effect } from 'effect'

import type { CurrentRuntime, RuntimeIdentity, RuntimeSource, RuntimeTarget } from '@harbr/domain'
import type { RuntimeProviderError } from '../runtime.errors'
import type { CreateRuntimeWindowsResult, RuntimeWindowCreation } from '../runtime.types'

export type RuntimeServiceApi = {
  readonly closeRuntime: (identity: RuntimeIdentity) => Effect.Effect<void, RuntimeProviderError>
  readonly createRuntimeWindows: (
    input: RuntimeWindowCreation,
  ) => Effect.Effect<CreateRuntimeWindowsResult, RuntimeProviderError>
  readonly getCurrentRuntime: Effect.Effect<CurrentRuntime, RuntimeProviderError>
  readonly openOrCreateRuntime: (
    target: RuntimeTarget,
    identity?: RuntimeIdentity,
  ) => Effect.Effect<void, RuntimeProviderError>
  readonly source: RuntimeSource
}

export class RuntimeService extends Context.Tag('@harbr/runtime/RuntimeService')<
  RuntimeService,
  RuntimeServiceApi
>() {}
