import type { VisibilityFilter } from '@harbour/domain'
import { atom } from 'jotai'

export const loadingAtom = atom(true)
export const noticeAtom = atom<string | null>(null)
export const actionsOpenAtom = atom(false)
export const actionSelectedIndexAtom = atom(0)
export const focusSearchNonceAtom = atom(0)
export const hoveredIndexAtom = atom<number | null>(null)
export const queryAtom = atom('')
export const selectedIndexAtom = atom(0)
export const visibilityAtom = atom<VisibilityFilter>('active')
