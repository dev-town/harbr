export type SurfaceId = 'actions' | 'browser' | 'confirm' | 'worktree-form'

export type SurfaceState =
  | { kind: 'actions'; route: 'active' | 'browse' }
  | { kind: 'browser' }
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
  surface: SurfaceState
  worktreeFormFocusTargetRef: FocusTargetRef | null
}

export function createSurfacesState(): SurfacesState {
  return {
    actionsFocusTargetRef: null,
    browserFocusTargetRef: null,
    focusRequestKey: 0,
    surface: { kind: 'browser' },
    worktreeFormFocusTargetRef: null,
  }
}
