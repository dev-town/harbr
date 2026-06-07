import { z } from 'zod'

import { ModuleSelectorSchema, ResolvedModuleSchema } from './module.contracts'
import { RuntimeAttachmentSchema, RuntimeFactSchema } from './runtime.contracts'
import { RepoKindSchema, RuntimeIssueSchema } from './shared.contracts'
import { WindowConfigSchema } from './window.contracts'
import { WorkspaceObservationSchema } from './workspace.contracts'

export const ProjectConfigSchema = z.object({
  modules: z.array(ModuleSelectorSchema),
  name: z.string(),
  repo: z.string(),
  windows: z.array(WindowConfigSchema).optional(),
})
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>

export const ProjectScanSchema = z.object({
  modules: z.array(ResolvedModuleSchema),
  projectName: z.string(),
  repoPath: z.string(),
  workspacePath: z.string(),
})
export type ProjectScan = z.infer<typeof ProjectScanSchema>

export const ProjectObservationSchema = z.object({
  projectIssue: z.string().nullable().optional(),
  projectName: z.string(),
  repoKind: RepoKindSchema,
  repoPath: z.string(),
  runtimeIssue: RuntimeIssueSchema.nullable(),
  runtimes: z.array(RuntimeFactSchema),
  workspaces: z.array(WorkspaceObservationSchema),
})
export type ProjectObservation = z.infer<typeof ProjectObservationSchema>

export const ProjectSummarySchema = z.object({
  activeSessionCount: z.number().int().nonnegative(),
  hasModules: z.boolean(),
  hasWorkspaces: z.boolean(),
  id: z.string(),
  name: z.string(),
  projectIssue: z.string().nullable().optional(),
  repoKind: RepoKindSchema,
  repoPath: z.string(),
  runtime: RuntimeAttachmentSchema.nullable(),
  workspaceCount: z.number().int().nonnegative(),
})
export type ProjectSummary = z.infer<typeof ProjectSummarySchema>
