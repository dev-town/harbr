import { z } from 'zod'

import { ResolvedModuleSchema } from './module.contracts'
import { WorkspaceKindSchema } from './shared.contracts'

export const WorkspaceObservationSchema = z.object({
  branchName: z.string().nullable().optional(),
  kind: WorkspaceKindSchema,
  modules: z.array(ResolvedModuleSchema),
  workspaceName: z.string(),
  workspacePath: z.string(),
})
export type WorkspaceObservation = z.infer<typeof WorkspaceObservationSchema>

export const WorkspaceSummarySchema = z.object({
  activeSessionCount: z.number().int().nonnegative(),
  branchName: z.string().nullable().optional(),
  hasModules: z.boolean(),
  id: z.string(),
  isDefault: z.boolean(),
  kind: WorkspaceKindSchema,
  moduleCount: z.number().int().nonnegative(),
  name: z.string(),
  projectId: z.string(),
  workspacePath: z.string(),
})
export type WorkspaceSummary = z.infer<typeof WorkspaceSummarySchema>
