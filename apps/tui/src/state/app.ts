import { atom } from 'jotai'
import type { RuntimeFact } from '@harbour/domain'

import type { AppRoute } from '../types/navigation'

export const isLoadingAtom = atom(true)
export const noticeAtom = atom<string | null>(null)
export const currentRuntimeAtom = atom<RuntimeFact | null>(null)
export const currentRouteAtom = atom<AppRoute>('active')
