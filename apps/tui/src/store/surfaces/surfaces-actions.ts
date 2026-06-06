import type { TuiStoreActions, TuiStoreGet, TuiStoreSet } from '../types'

export function createSurfacesActions(set: TuiStoreSet, _get: TuiStoreGet): Pick<
  TuiStoreActions,
  'closeActionsMenu' | 'registerFocusTarget'
> {
  return {
    closeActionsMenu: () => set((state) => ({
      app: { ...state.app, notice: null },
      surfaces: { ...state.surfaces, surface: { kind: 'browser' } },
    })),
    registerFocusTarget: (id, ref) => set((state) => {
      const currentRef = id === 'actions'
        ? state.surfaces.actionsFocusTargetRef
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
            : id === 'worktree-form'
              ? { worktreeFormFocusTargetRef: ref }
              : { browserFocusTargetRef: ref }),
        },
      }
    }),
  }
}
