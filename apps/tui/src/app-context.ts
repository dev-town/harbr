import type { createCliRenderer } from '@opentui/core'
import type { createStore } from 'jotai'
import { createContext, useContext } from 'react'

import type { TuiOptions } from './types'

export type TuiAppContext = {
  options: TuiOptions
  renderer: Awaited<ReturnType<typeof createCliRenderer>>
  store: ReturnType<typeof createStore>
}

const TuiContext = createContext<TuiAppContext | null>(null)

export const TuiContextProvider = TuiContext.Provider

export function useTuiContext() {
  const context = useContext(TuiContext)

  if (!context) {
    throw new Error('Tui context missing')
  }

  return context
}
