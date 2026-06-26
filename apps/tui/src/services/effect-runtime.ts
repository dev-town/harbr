import { ManagedRuntime } from 'effect'

import type { TuiOptions } from '~/types'
import { makeTuiLayer } from './layer'

export function makeTuiEffectRuntime(options: TuiOptions) {
  return ManagedRuntime.make(makeTuiLayer(options))
}

export type TuiEffectRuntime = ReturnType<typeof makeTuiEffectRuntime>
