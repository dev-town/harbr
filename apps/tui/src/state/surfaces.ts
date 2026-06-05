import { atom } from 'jotai'

import { isActionsOpenAtom, isWorktreeFormOpenAtom } from '../routes/browse'

export type SurfaceId = 'actions' | 'browser' | 'confirm' | 'worktree-form'

export type FocusTarget = {
  blur?: () => void
  focus?: () => void
  isDestroyed?: boolean
}

export type FocusTargetRef = {
  current: FocusTarget | null
}

export const browserFocusTargetRefAtom = atom<FocusTargetRef | null>(null)
export const actionsFocusTargetRefAtom = atom<FocusTargetRef | null>(null)
export const worktreeFormFocusTargetRefAtom = atom<FocusTargetRef | null>(null)
export const activeFocusTargetAtom = atom((get) =>
  (
    get(isWorktreeFormOpenAtom)
      ? get(worktreeFormFocusTargetRefAtom)
      : get(isActionsOpenAtom)
        ? get(actionsFocusTargetRefAtom)
        : get(browserFocusTargetRefAtom)
  )?.current ?? null,
)
