import { useAtomValue, useSetAtom, useStore } from 'jotai'

import { handleWorktreeFormSubmit } from '../../actions/worktree'
import { useTuiServices } from '../useTuiServices'
import { validateBranchName, validateWorkspaceName } from '../../helpers/worktree-form'
import {
  closeWorktreeFormAtom,
  isWorktreeFormOpenAtom,
  worktreeFormBranchNameAtom,
  worktreeFormShowErrorsAtom,
  worktreeFormStepAtom,
  worktreeFormWorkspaceNameAtom,
} from '../../state'

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
    step === 'workspace' ? validateWorkspaceName(workspaceName) : validateBranchName(branchName)
  const showValidationError = Boolean(validationError) && (showErrors || value.length > 0)

  return {
    helperText:
      step === 'workspace'
        ? 'Use letters, numbers, -, _, .'
        : 'Press Enter to create the workspace',
    isOpen,
    onClose,
    onInput: step === 'workspace' ? setWorkspaceName : setBranchName,
    onSubmit: () => handleWorktreeFormSubmit(services, store),
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
