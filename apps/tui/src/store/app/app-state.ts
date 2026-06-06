import type { RuntimeFact } from '@harbour/domain'

import type { AppRoute } from '../../types/navigation'

export type AppState = {
  currentRoute: AppRoute
  currentRuntime: RuntimeFact | null
  isLoading: boolean
  notice: string | null
}

export function createAppState(): AppState {
  return {
    currentRoute: 'active',
    currentRuntime: null,
    isLoading: true,
    notice: null,
  }
}
