import { z } from 'zod'

export const RepoKindSchema = z.enum(['bare', 'standard'])
export type RepoKind = z.infer<typeof RepoKindSchema>

export const WorkspaceKindSchema = z.enum(['default', 'worktree'])
export type WorkspaceKind = z.infer<typeof WorkspaceKindSchema>

export const RuntimeScopeSchema = z.enum(['module', 'project', 'workspace'])
export type RuntimeScope = z.infer<typeof RuntimeScopeSchema>

export const RuntimeStatusSchema = z.enum(['open'])
export type RuntimeStatus = z.infer<typeof RuntimeStatusSchema>

export const RuntimeIssueSchema = z.enum(['tmux_not_found'])
export type RuntimeIssue = z.infer<typeof RuntimeIssueSchema>
