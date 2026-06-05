import { useAtomValue, useSetAtom, useStore } from 'jotai'

import { handleBrowseWorktreeSubmit } from '../actions'
import { useTuiServices } from '../../../hooks/useTuiServices'
import { validateBranchName, validateWorkspaceName } from '../../../helpers/worktree-form'
import {
  isWorktreeFormOpenAtom,
  worktreeFormBranchNameAtom,
  worktreeFormShowErrorsAtom,
  worktreeFormStepAtom,
  worktreeFormWorkspaceNameAtom,
} from '../atoms'
import { closeWorktreeFormAtom } from '../state/actions'

export function useCreateWorkspace() {
  const services = useTuiServices()
  const store = useStore()

  const isOpen = useAtomValue(isWorktreeFormOpenAtom)
  const step = useAtomValue(worktreeFormStepAtom)
  const branchName = useAtomValue(worktreeFormBranchNameAtom)
  const showErrors = useAtomValue(worktreeFormShowErrorsAtom)
  const workspaceName = useAtomValue(worktreeFormWorkspaceNameAtom)

  const onClose = useSetAtom(closeWorktreeFormAtom)
  const setBranchName = useSetAtom(worktreeFormBranchNameAtom)
  const setWorkspaceName = useSetAtom(worktreeFormWorkspaceNameAtom)

  const value = step === 'workspace' ? workspaceName : branchName
  const validationError =
    step === 'workspace'
      ? validateWorkspaceName(workspaceName)
      : validateBranchName(branchName)
  const showValidationError = Boolean(validationError) && (showErrors || value.length > 0)

  return {
    isOpen,
    onClose,
    onInput: step === 'workspace' ? setWorkspaceName : setBranchName,
    onSubmit: () => handleBrowseWorktreeSubmit(services, store),
    placeholder: step === 'workspace' ? 'workspace-name' : 'branch-name',
    showValidationError,
    subtitle:
      step === 'workspace'
        ? 'Enter workspace name'
        : `Workspace ${workspaceName} will start on this branch`,
    title: step === 'workspace' ? 'Create workspace' : 'Confirm branch',
    validationError,
    value,
  }
}
