import { z } from 'zod'

import { RuntimeAttachmentSchema } from './runtime.contracts'

export const ModuleSelectorModeSchema = z.enum(['children', 'explicit'])
export type ModuleSelectorMode = z.infer<typeof ModuleSelectorModeSchema>

export const ModuleSelectorSchema = z.object({
  raw: z.string(),
  path: z.string(),
  mode: ModuleSelectorModeSchema,
})
export type ModuleSelector = z.infer<typeof ModuleSelectorSchema>

export const ResolvedModuleSchema = z.object({
  name: z.string(),
  path: z.string(),
  selector: ModuleSelectorSchema,
  workspacePath: z.string(),
})
export type ResolvedModule = z.infer<typeof ResolvedModuleSchema>

export const ModuleSummarySchema = z.object({
  hasActiveSession: z.boolean(),
  id: z.string(),
  name: z.string(),
  path: z.string(),
  projectId: z.string(),
  projectName: z.string(),
  repoPath: z.string(),
  runtime: RuntimeAttachmentSchema.nullable(),
  workspaceId: z.string(),
  workspaceName: z.string(),
  workspacePath: z.string(),
})
export type ModuleSummary = z.infer<typeof ModuleSummarySchema>
