import { z } from 'zod'

export const WorkspaceNameSchema = z
  .string()
  .trim()
  .min(1, 'Workspace name is required')
  .regex(/^[A-Za-z0-9_-]+$/, 'Use letters, numbers, - or _ only')

export type WorkspaceName = z.infer<typeof WorkspaceNameSchema>

export const BranchNameSchema = z
  .string()
  .trim()
  .min(1, 'Branch name is required')
  .superRefine((value, ctx) => {
    if (value.startsWith('-')) {
      ctx.addIssue({
        code: 'custom',
        message: 'Branch name cannot start with -',
      })
      return
    }

    if (/\s/.test(value)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Branch name cannot contain spaces',
      })
    }
  })

export type BranchName = z.infer<typeof BranchNameSchema>

export const CreateWorktreeInputSchema = z.object({
  branchName: BranchNameSchema,
  workspaceName: WorkspaceNameSchema,
})

export type CreateWorktreeInput = z.infer<typeof CreateWorktreeInputSchema>
