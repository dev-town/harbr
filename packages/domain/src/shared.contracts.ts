import { z } from 'zod'

export const RepoKindSchema = z.enum(['bare', 'standard'])
export type RepoKind = z.infer<typeof RepoKindSchema>

export const WorkspaceKindSchema = z.enum(['default', 'worktree'])
export type WorkspaceKind = z.infer<typeof WorkspaceKindSchema>

export const WorkspaceProviderSchema = z.string().regex(/^[a-z][a-z0-9-]*$/)
export type WorkspaceProvider = z.infer<typeof WorkspaceProviderSchema>

export const RuntimeScopeSchema = z.enum(['module', 'project', 'workspace'])
export type RuntimeScope = z.infer<typeof RuntimeScopeSchema>

export const RuntimeStatusSchema = z.enum(['open'])
export type RuntimeStatus = z.infer<typeof RuntimeStatusSchema>

export const RuntimeProviderSchema = z.string().min(1)
export type RuntimeProvider = z.infer<typeof RuntimeProviderSchema>

export const RuntimeSourceSchema = z.object({
  provider: RuntimeProviderSchema,
  sourceId: z.string().min(1),
})
export type RuntimeSource = z.infer<typeof RuntimeSourceSchema>

export const RuntimeIssueCodeSchema = z.enum([
  'provider_not_found',
  'source_unavailable',
])
export type RuntimeIssueCode = z.infer<typeof RuntimeIssueCodeSchema>

export const RuntimeIssueSchema = z.object({
  code: RuntimeIssueCodeSchema,
  source: RuntimeSourceSchema,
})
export type RuntimeIssue = z.infer<typeof RuntimeIssueSchema>
