import type { CurrentRuntime } from '@harbr/domain'

import type { AppRoute } from '~/types/navigation'
import type { NoticeLevel } from '~/types/notice'

export type Notice = {
  id: number
  level: NoticeLevel
  message: string
}

export type AppState = {
  currentRoute: AppRoute
  currentRuntime: CurrentRuntime
  isLoading: boolean
  notice: Notice | null
  noticeSequence: number
}

export function createAppState(): AppState {
  return {
    currentRoute: 'active',
    currentRuntime: null,
    isLoading: true,
    notice: null,
    noticeSequence: 0,
  }
}
