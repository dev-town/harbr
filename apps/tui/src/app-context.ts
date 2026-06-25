import type { createCliRenderer } from '@opentui/core'
import { createContext } from 'react'

import type { TuiOptions } from './types'
import type { TuiEffectRuntime } from './services/effect-runtime'
import type { tuiStore } from './store'

export type TuiServices = {
  effectRuntime: TuiEffectRuntime
  options: TuiOptions
  renderer: Awaited<ReturnType<typeof createCliRenderer>>
  shutdown: () => Promise<void>
}

export type TuiStore = typeof tuiStore

export const TuiServicesContext = createContext<TuiServices | null>(null)

export const TuiServicesProvider = TuiServicesContext.Provider
