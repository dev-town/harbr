import type { VisibilityFilter } from '@harbour/domain'
import { atom } from 'jotai'

export const isLoadingAtom = atom(true)
export const noticeAtom = atom<string | null>(null)
export const isActionsOpenAtom = atom(false)
export const selectedActionRowIdAtom = atom<string | null>(null)
export const browseSearchFocusNonceAtom = atom(0)
export const hoveredActionRowIdAtom = atom<string | null>(null)
export const browseQueryAtom = atom('')
export const selectedBrowseRowIdAtom = atom<string | null>(null)
export const hoveredBrowseRowIdAtom = atom<string | null>(null)
export const browseVisibilityAtom = atom<VisibilityFilter>('active')
