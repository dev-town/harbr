import { z } from 'zod'

import { HarbourContextSchema } from './context.contracts'
import { RuntimeScopeSchema, RuntimeStatusSchema } from './shared.contracts'

export const RuntimeTargetSchema = z.object({
  cwd: z.string(),
  moduleName: z.string().nullable(),
  projectName: z.string(),
  workspaceName: z.string().nullable(),
})

export type RuntimeTarget = z.infer<typeof RuntimeTargetSchema>

export const RuntimeAttachmentSchema = z.object({
  sessionName: z.string(),
  status: RuntimeStatusSchema,
})

export type RuntimeAttachment = z.infer<typeof RuntimeAttachmentSchema>

export const ResolvedContextTargetSchema = z.object({
  breadcrumb: z.string(),
  context: HarbourContextSchema,
  label: z.string(),
  runtimeTarget: RuntimeTargetSchema,
  scope: RuntimeScopeSchema,
})

export type ResolvedContextTarget = z.infer<typeof ResolvedContextTargetSchema>

export const RuntimeFactSchema = z.object({
  moduleName: z.string().nullable(),
  projectName: z.string(),
  scope: RuntimeScopeSchema,
  sessionName: z.string(),
  status: RuntimeStatusSchema,
  workspaceName: z.string().nullable(),
})

export type RuntimeFact = z.infer<typeof RuntimeFactSchema>

export const ActiveRuntimeSummarySchema = z.object({
  id: z.string(),
  moduleId: z.string().nullable(),
  moduleName: z.string().nullable(),
  modulePath: z.string().nullable(),
  projectId: z.string(),
  projectName: z.string(),
  repoPath: z.string(),
  scope: RuntimeScopeSchema,
  sessionName: z.string(),
  status: RuntimeStatusSchema,
  workspaceId: z.string().nullable(),
  workspaceName: z.string().nullable(),
  workspacePath: z.string().nullable(),
})

export type ActiveRuntimeSummary = z.infer<typeof ActiveRuntimeSummarySchema>
