import type { createCliRenderer } from '@opentui/core'
import type { createStore } from 'jotai'
import { createContext } from 'react'

import type { TuiOptions } from './types'

export type TuiServices = {
  options: TuiOptions
  renderer: Awaited<ReturnType<typeof createCliRenderer>>
}

export type TuiStore = ReturnType<typeof createStore>

export const TuiServicesContext = createContext<TuiServices | null>(null)

export const TuiServicesProvider = TuiServicesContext.Provider
