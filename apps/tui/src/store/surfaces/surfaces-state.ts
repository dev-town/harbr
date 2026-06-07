import type { ResolvedContextTarget } from '@harbour/domain'

export type SurfaceId =
  | 'actions'
  | 'browser'
  | 'confirm'
  | 'help'
  | 'window-picker'
  | 'worktree-form'

export type SurfaceState =
  | { kind: 'actions'; route: 'active' | 'browse' }
  | { kind: 'browser' }
  | { kind: 'help' }
  | {
      contextLabel?: string
      kind: 'window-picker'
      route: 'active' | 'browse'
      target: ResolvedContextTarget
    }
  | { kind: 'worktree-form' }

export type FocusTarget = {
  blur?: () => void
  focus?: () => void
  isDestroyed?: boolean
}

export type FocusTargetRef = {
  current: FocusTarget | null
}

export type SurfacesState = {
  actionsFocusTargetRef: FocusTargetRef | null
  browserFocusTargetRef: FocusTargetRef | null
  focusRequestKey: number
  helpFocusTargetRef: FocusTargetRef | null
  surface: SurfaceState
  windowPickerFocusTargetRef: FocusTargetRef | null
  worktreeFormFocusTargetRef: FocusTargetRef | null
}

export function createSurfacesState(): SurfacesState {
  return {
    actionsFocusTargetRef: null,
    browserFocusTargetRef: null,
    focusRequestKey: 0,
    helpFocusTargetRef: null,
    surface: { kind: 'browser' },
    windowPickerFocusTargetRef: null,
    worktreeFormFocusTargetRef: null,
  }
}
