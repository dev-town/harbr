import { useMemo } from 'react'

import { handleBrowseWorktreeSubmit } from '../actions'
import { useTuiServices } from '../../../hooks/useTuiServices'
import { selectWorktreeFormView, tuiStore, useTuiStore } from '../../../store'

export function useCreateWorkspace() {
  const services = useTuiServices()
  const worktreeForm = useTuiStore((state) => state.worktreeForm)
  const step = useTuiStore((state) => state.worktreeForm.step)
  const onClose = useTuiStore((state) => state.closeWorktreeForm)
  const view = useMemo(() => selectWorktreeFormView(tuiStore.getState()), [worktreeForm])

  return {
    ...view,
    onClose,
    onInput: (value: string) => {
      tuiStore.setState((state) => ({
        worktreeForm:
          step === 'workspace'
            ? { ...state.worktreeForm, workspaceName: value }
            : { ...state.worktreeForm, branchName: value },
      }))
    },
    onSubmit: () => handleBrowseWorktreeSubmit(services, tuiStore),
  }
}
