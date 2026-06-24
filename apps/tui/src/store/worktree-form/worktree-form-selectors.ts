import {
  validateBranchName,
  validateWorkspaceName,
} from '../../helpers/worktree-form'
import type { TuiStoreModel } from '../types'

export function selectWorktreeFormView(state: TuiStoreModel) {
  const { branchName, showErrors, step, workspaceName } = state.worktreeForm
  const value = step === 'workspace' ? workspaceName : branchName
  const validationError =
    step === 'workspace'
      ? validateWorkspaceName(workspaceName)
      : validateBranchName(branchName)

  return {
    isOpen: state.surfaces.surface.kind === 'worktree-form',
    placeholder: step === 'workspace' ? 'workspace-name' : 'branch-name',
    showValidationError:
      Boolean(validationError) && (showErrors || value.length > 0),
    subtitle:
      step === 'workspace'
        ? 'Enter workspace name'
        : `Workspace ${workspaceName} will start on this branch`,
    title: step === 'workspace' ? 'Create workspace' : 'Confirm branch',
    validationError,
    value,
  }
}
