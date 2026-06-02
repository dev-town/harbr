import { BranchNameSchema, WorkspaceNameSchema } from '@harbour/domain'

export function validateWorkspaceName(value: string) {
  const result = WorkspaceNameSchema.safeParse(value)

  return result.success
    ? null
    : (result.error.issues[0]?.message ?? 'Workspace name is not valid')
}

export function validateBranchName(value: string) {
  const result = BranchNameSchema.safeParse(value)

  return result.success
    ? null
    : (result.error.issues[0]?.message ?? 'Branch name is not valid')
}
