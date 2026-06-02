import { atom } from 'jotai'

import type { VisibilityFilter } from '../types/navigation'

export type WorktreeFormStep = 'branch' | 'workspace'

export const isLoadingAtom = atom(true)
export const noticeAtom = atom<string | null>(null)
export const isActionsOpenAtom = atom(false)
export const isWorktreeFormOpenAtom = atom(false)
export const selectedActionRowIdAtom = atom<string | null>(null)
export const browseSearchFocusNonceAtom = atom(0)
export const hoveredActionRowIdAtom = atom<string | null>(null)
export const browseQueryAtom = atom('')
export const selectedBrowseRowIdAtom = atom<string | null>(null)
export const hoveredBrowseRowIdAtom = atom<string | null>(null)
export const browseVisibilityAtom = atom<VisibilityFilter>('active')
export const worktreeFormBranchNameAtom = atom('')
export const worktreeFormProjectIdAtom = atom<string | null>(null)
export const worktreeFormShowErrorsAtom = atom(false)
export const worktreeFormStepAtom = atom<WorktreeFormStep>('workspace')
export const worktreeFormWorkspaceNameAtom = atom('')
