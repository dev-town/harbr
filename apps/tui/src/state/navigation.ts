import type { HarbourSection } from '@harbour/domain'
import { atom } from 'jotai'

export const currentSectionAtom = atom<HarbourSection>('projects')
export const previousSelectedIndexAtom = atom(0)
export const selectedProjectIdAtom = atom<string | null>(null)
export const selectedWorkspaceIdAtom = atom<string | null>(null)
export const selectedWorkspaceImplicitAtom = atom(false)
