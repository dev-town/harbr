import { createWorktreeFormState } from './worktree-form-state'
import type { TuiStoreActions, TuiStoreGet, TuiStoreSet } from '~/store/types'

export function createWorktreeFormActions(
  set: TuiStoreSet,
  get: TuiStoreGet,
): Pick<
  TuiStoreActions,
  'backWorktreeForm' | 'closeWorktreeForm' | 'openCreateWorkspaceForm'
> {
  return {
    backWorktreeForm: () => {
      const { worktreeForm } = get()

      if (worktreeForm.step === 'branch') {
        set((state) => ({
          worktreeForm: {
            ...state.worktreeForm,
            branchName: '',
            showErrors: false,
            step: 'workspace',
          },
        }))
        return
      }

      get().closeWorktreeForm()
    },
    closeWorktreeForm: () =>
      set((state) => ({
        app: { ...state.app, notice: null },
        surfaces: { ...state.surfaces, surface: { kind: 'browser' } },
        worktreeForm: createWorktreeFormState(),
      })),
    openCreateWorkspaceForm: (projectId) =>
      set((state) => ({
        app: { ...state.app, notice: null },
        surfaces: { ...state.surfaces, surface: { kind: 'worktree-form' } },
        worktreeForm: { ...createWorktreeFormState(), projectId },
      })),
  }
}
