import type { TuiStoreActions, TuiStoreGet, TuiStoreSet } from '../types'

export function createSurfacesActions(set: TuiStoreSet, _get: TuiStoreGet): Pick<
  TuiStoreActions,
  | 'closeActionsMenu'
  | 'closeWindowPicker'
  | 'openWindowPicker'
  | 'registerFocusTarget'
> {
  return {
    closeActionsMenu: () => set((state) => ({
      app: { ...state.app, notice: null },
        surfaces: { ...state.surfaces, surface: { kind: 'browser' } },
      })),
    closeWindowPicker: () => set((state) => ({
      app: { ...state.app, notice: null },
      surfaces: {
        ...state.surfaces,
        surface: {
          kind: 'actions',
          route:
            state.surfaces.surface.kind === 'window-picker'
              ? state.surfaces.surface.route
              : state.app.currentRoute,
        },
      },
    })),
    openWindowPicker: (target, contextLabel) => set((state) => ({
      app: { ...state.app, notice: null },
      surfaces: {
        ...state.surfaces,
        surface: {
          ...(contextLabel ? { contextLabel } : {}),
          kind: 'window-picker',
          route: state.app.currentRoute,
          target,
        },
      },
    })),
    registerFocusTarget: (id, ref) => set((state) => {
      const currentRef = id === 'actions'
        ? state.surfaces.actionsFocusTargetRef
        : id === 'window-picker'
          ? state.surfaces.windowPickerFocusTargetRef
        : id === 'worktree-form'
          ? state.surfaces.worktreeFormFocusTargetRef
          : state.surfaces.browserFocusTargetRef

      if (currentRef === ref) {
        return state
      }

      return {
        surfaces: {
          ...state.surfaces,
          ...(id === 'actions'
            ? { actionsFocusTargetRef: ref }
            : id === 'window-picker'
              ? { windowPickerFocusTargetRef: ref }
            : id === 'worktree-form'
              ? { worktreeFormFocusTargetRef: ref }
              : { browserFocusTargetRef: ref }),
        },
      }
    }),
  }
}
