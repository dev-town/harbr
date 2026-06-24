import type { AppRoute } from '../../types/navigation'
import { createWorktreeFormState } from '../worktree-form/worktree-form-state'
import type { TuiStoreActions, TuiStoreGet, TuiStoreSet } from '../types'

const orderedRoutes: readonly AppRoute[] = ['active', 'browse']

export function createAppActions(
  set: TuiStoreSet,
  get: TuiStoreGet,
): Pick<
  TuiStoreActions,
  | 'clearNotice'
  | 'nextRoute'
  | 'previousRoute'
  | 'setCurrentRoute'
  | 'setLoading'
  | 'setNotice'
> {
  return {
    clearNotice: () =>
      set((state) => ({ app: { ...state.app, notice: null } })),
    nextRoute: () => {
      const currentIndex = orderedRoutes.indexOf(get().app.currentRoute)
      get().setCurrentRoute(
        orderedRoutes[(currentIndex + 1) % orderedRoutes.length] ?? 'browse',
      )
    },
    previousRoute: () => {
      const currentIndex = orderedRoutes.indexOf(get().app.currentRoute)
      get().setCurrentRoute(
        orderedRoutes[
          (currentIndex - 1 + orderedRoutes.length) % orderedRoutes.length
        ] ?? 'browse',
      )
    },
    setCurrentRoute: (route) =>
      set((state) => ({
        app: { ...state.app, currentRoute: route, notice: null },
        surfaces: {
          ...state.surfaces,
          focusRequestKey: state.surfaces.focusRequestKey + 1,
          interactionMode: 'input',
          surface: { kind: 'browser' },
        },
        worktreeForm: createWorktreeFormState(),
      })),
    setLoading: (isLoading) =>
      set((state) => ({ app: { ...state.app, isLoading } })),
    setNotice: (notice, level = 'info') =>
      set((state) => {
        if (!notice) {
          return { app: { ...state.app, notice: null } }
        }

        const noticeSequence = state.app.noticeSequence + 1

        return {
          app: {
            ...state.app,
            notice: { id: noticeSequence, level, message: notice },
            noticeSequence,
          },
        }
      }),
  }
}
