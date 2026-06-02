import { atom } from 'jotai'

import type { HarbourSection } from '../types/navigation'

export const currentSectionAtom = atom<HarbourSection>('projects')
export const selectedProjectIdAtom = atom<string | null>(null)
export const selectedWorkspaceIdAtom = atom<string | null>(null)
export const selectedWorkspaceImplicitAtom = atom(false)
