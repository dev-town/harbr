import type { createCliRenderer } from '@opentui/core'
import { createContext } from 'react'

import type { TuiOptions } from './types'
import type { tuiStore } from './store'

export type TuiServices = {
  options: TuiOptions
  renderer: Awaited<ReturnType<typeof createCliRenderer>>
}

export type TuiStore = typeof tuiStore

export const TuiServicesContext = createContext<TuiServices | null>(null)

export const TuiServicesProvider = TuiServicesContext.Provider
