import { atom } from 'jotai'

import type { HarbourSection, VisibilityFilter } from '../../../../types/navigation'

export const browseSearchFocusNonceAtom = atom(0)
export const browseQueryAtom = atom('')
export const browseVisibilityAtom = atom<VisibilityFilter>('active')
export const browseSectionAtom = atom<HarbourSection>('projects')
export const selectedProjectIdAtom = atom<string | null>(null)
export const selectedWorkspaceIdAtom = atom<string | null>(null)
export const selectedWorkspaceImplicitAtom = atom(false)
