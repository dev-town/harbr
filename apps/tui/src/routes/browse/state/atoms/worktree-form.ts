import { atom } from 'jotai'

export type WorktreeFormStep = 'branch' | 'workspace'

export const isWorktreeFormOpenAtom = atom(false)
export const worktreeFormBranchNameAtom = atom('')
export const worktreeFormProjectIdAtom = atom<string | null>(null)
export const worktreeFormShowErrorsAtom = atom(false)
export const worktreeFormStepAtom = atom<WorktreeFormStep>('workspace')
export const worktreeFormWorkspaceNameAtom = atom('')
