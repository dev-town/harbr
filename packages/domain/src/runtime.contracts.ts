import { z } from 'zod'

import { HarbourContextSchema } from './context.contracts'
import {
  RuntimeIssueSchema,
  RuntimeScopeSchema,
  RuntimeSourceSchema,
  RuntimeStatusSchema,
  WorkspaceProviderSchema,
  type RuntimeSource,
} from './shared.contracts'

export const RuntimeTargetSchema = z.object({
  cwd: z.string(),
  moduleName: z.string().nullable(),
  projectName: z.string(),
  workspaceName: z.string().nullable(),
})

export type RuntimeTarget = z.infer<typeof RuntimeTargetSchema>

export const RuntimeIdentitySchema = z.object({
  displayLabel: z.string(),
  externalId: z.string().min(1),
  source: RuntimeSourceSchema,
})

export type RuntimeIdentity = z.infer<typeof RuntimeIdentitySchema>

export const RuntimeAttachmentSchema = z.object({
  identity: RuntimeIdentitySchema,
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
  identity: RuntimeIdentitySchema,
  moduleName: z.string().nullable(),
  projectName: z.string(),
  scope: RuntimeScopeSchema,
  status: RuntimeStatusSchema,
  workspaceName: z.string().nullable(),
  workspacePath: z.string().optional(),
})

export type RuntimeFact = z.infer<typeof RuntimeFactSchema>

export const RuntimePathObservationSchema = z.object({
  contextPath: z.string().min(1),
  identity: RuntimeIdentitySchema,
  status: RuntimeStatusSchema,
})

export type RuntimePathObservation = z.infer<
  typeof RuntimePathObservationSchema
>

export const RuntimeObservationSchema = z.union([
  RuntimeFactSchema,
  RuntimePathObservationSchema,
])

export type RuntimeObservation = z.infer<typeof RuntimeObservationSchema>

export const ActiveRuntimeSummarySchema = z.object({
  branchName: z.string().nullable(),
  id: z.string(),
  moduleId: z.string().nullable(),
  moduleName: z.string().nullable(),
  modulePath: z.string().nullable(),
  projectId: z.string(),
  projectName: z.string(),
  repoPath: z.string(),
  runtime: RuntimeAttachmentSchema,
  scope: RuntimeScopeSchema,
  workspaceId: z.string().nullable(),
  workspaceName: z.string().nullable(),
  workspacePath: z.string().nullable(),
  workspaceProvider: WorkspaceProviderSchema.nullable(),
})

export type ActiveRuntimeSummary = z.infer<typeof ActiveRuntimeSummarySchema>

export const RuntimeDiscoverySchema = z.object({
  runtimeIssue: RuntimeIssueSchema.nullable(),
  runtimes: z.array(RuntimeObservationSchema),
  source: RuntimeSourceSchema,
})
export type RuntimeDiscovery = z.infer<typeof RuntimeDiscoverySchema>

export const CurrentRuntimeSchema = RuntimeAttachmentSchema.nullable()
export type CurrentRuntime = z.infer<typeof CurrentRuntimeSchema>

export function isSameRuntimeSource(left: RuntimeSource, right: RuntimeSource) {
  return left.provider === right.provider && left.sourceId === right.sourceId
}

export function isSameRuntimeIdentity(
  left: RuntimeIdentity,
  right: RuntimeIdentity,
) {
  return (
    isSameRuntimeSource(left.source, right.source) &&
    left.externalId === right.externalId
  )
}
