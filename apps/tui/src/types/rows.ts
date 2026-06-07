import type { ResolvedContextTarget, RuntimeAttachment } from '@harbour/domain'

export type RowKind =
  | 'action'
  | 'active-action'
  | 'module'
  | 'project'
  | 'workspace'

export type BaseRow = {
  id: string
  kind: RowKind
  label: string
  isActive: boolean
  isCurrent?: boolean
  metadata?: string
}

export type ProjectRow = BaseRow & {
  kind: 'project'
  projectId: string
  activeSessionCount: number
  hasModules: boolean
  hasWorkspaces: boolean
  projectIssue?: string | null
  repoPath: string
  runtime: RuntimeAttachment | null
  target: ResolvedContextTarget
}

export type WorkspaceRow = BaseRow & {
  kind: 'workspace'
  projectId: string
  workspaceId: string
  activeSessionCount: number
  branchName?: string | null
  hasModules: boolean
  isDefault: boolean
  runtime: RuntimeAttachment | null
  target: ResolvedContextTarget
  workspacePath: string
}

export type ModuleRow = BaseRow & {
  kind: 'module'
  projectId: string
  workspaceId: string
  moduleId: string
  hasSession: boolean
  modulePath: string
  runtime: RuntimeAttachment | null
  target: ResolvedContextTarget
}

export type ActionRow = BaseRow & {
  kind: 'action'
  actionId: string
  disabledNotice?: string
  runtime: RuntimeAttachment | null
  target: ResolvedContextTarget
}

export type ActiveActionRow = {
  actionId: string
  disabledNotice?: string
  id: string
  kind: 'active-action'
  label: string
  target: HarbourRow & { runtime: RuntimeAttachment }
}

export type HarbourRow = ModuleRow | ProjectRow | WorkspaceRow

export type BrowseRow = ActionRow | HarbourRow
