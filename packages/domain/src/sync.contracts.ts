import { z } from 'zod'

import { RepoKindSchema, RuntimeIssueSchema } from './shared.contracts'

export const SyncProjectResultStatusSchema = z.enum([
  'error',
  'no_workspace',
  'synced',
])
export type SyncProjectResultStatus = z.infer<
  typeof SyncProjectResultStatusSchema
>

export const SyncProjectResultSchema = z.object({
  errorTag: z.string().nullable(),
  moduleCount: z.number().int().nonnegative(),
  projectName: z.string(),
  repoKind: RepoKindSchema.nullable(),
  repoPath: z.string(),
  runtimeCount: z.number().int().nonnegative(),
  runtimeIssue: RuntimeIssueSchema.nullable(),
  status: SyncProjectResultStatusSchema,
  workspaceCount: z.number().int().nonnegative(),
})
export type SyncProjectResult = z.infer<typeof SyncProjectResultSchema>

export const SyncResultSchema = z.object({
  projects: z.array(SyncProjectResultSchema),
})
export type SyncResult = z.infer<typeof SyncResultSchema>
