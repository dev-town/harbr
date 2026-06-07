import type { ActiveRuntimeSummary, HarbourContext } from '@harbour/domain'

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
}

export type WorkspaceRow = BaseRow & {
  kind: 'workspace'
  projectId: string
  workspaceId: string
  activeSessionCount: number
  branchName?: string | null
  hasModules: boolean
  isDefault: boolean
  workspacePath: string
}

export type ModuleRow = BaseRow & {
  kind: 'module'
  projectId: string
  workspaceId: string
  moduleId: string
  hasSession: boolean
  modulePath: string
}

export type ActionRow = BaseRow & {
  kind: 'action'
  actionId: string
  disabledNotice?: string
  target: HarbourContext
}

export type ActiveActionRow = {
  actionId: string
  disabledNotice?: string
  id: string
  kind: 'active-action'
  label: string
  windowTarget?: HarbourContext
  target: ActiveRuntimeRow
}

export type ActiveRuntimeRow = {
  id: string
  contextLabel: string
  isCurrent: boolean
  label: string
  moduleId: string | null
  moduleLabel: string | null
  modulePath: string | null
  projectId: string
  projectLabel: string
  repoPath: string
  scope: ActiveRuntimeSummary['scope']
  sessionName: string
  status: ActiveRuntimeSummary['status']
  workspaceId: string | null
  workspaceLabel: string | null
  workspacePath: string | null
}

export type HarbourRow = ActionRow | ModuleRow | ProjectRow | WorkspaceRow
