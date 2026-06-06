export type WorktreeFormStep = 'branch' | 'workspace'

export type WorktreeFormState = {
  branchName: string
  projectId: string | null
  showErrors: boolean
  step: WorktreeFormStep
  workspaceName: string
}

export function createWorktreeFormState(): WorktreeFormState {
  return {
    branchName: '',
    projectId: null,
    showErrors: false,
    step: 'workspace',
    workspaceName: '',
  }
}
