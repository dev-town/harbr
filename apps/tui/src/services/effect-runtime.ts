import { Layer, ManagedRuntime } from 'effect'

import { makeObservabilityLayer } from '~/observability/layer'
import type { TuiOptions } from '~/types'
import { makeTuiLayer } from './layer'

export function makeTuiEffectRuntime(options: TuiOptions) {
  return ManagedRuntime.make(makeTuiLayer(options))
}

export function makeSyncEffectRuntime(options: TuiOptions) {
  return ManagedRuntime.make(
    options.profile ? makeObservabilityLayer(options.profile) : Layer.empty,
  )
}

export type TuiEffectRuntime = ReturnType<typeof makeTuiEffectRuntime>
