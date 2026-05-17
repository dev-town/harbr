export type HarbourSection = 'actions' | 'modules' | 'projects' | 'workspaces'

export type VisibilityFilter = 'active' | 'all'

export type HarbourContext = {
  projectId?: string
  workspaceId?: string
  moduleId?: string
}

export const harbourCommandIds = {
  appQuit: 'app.quit',
  browseBack: 'browse.back',
  browseDown: 'browse.down',
  browseOpenActions: 'browse.open_actions',
  browseRefresh: 'browse.refresh',
  browseSelect: 'browse.select',
  browseToggleVisibility: 'browse.toggle_visibility',
  browseUp: 'browse.up',
} as const

export type HarbourCommandId =
  (typeof harbourCommandIds)[keyof typeof harbourCommandIds]

export type RowKind = 'action' | 'module' | 'project' | 'workspace'

export type BaseRow = {
  id: string
  kind: RowKind
  label: string
  isActive: boolean
  metadata?: string
}

export type ProjectRow = BaseRow & {
  kind: 'project'
  projectId: string
  activeSessionCount: number
  hasModules: boolean
  hasWorkspaces: boolean
}

export type WorkspaceRow = BaseRow & {
  kind: 'workspace'
  projectId: string
  workspaceId: string
  activeSessionCount: number
  hasModules: boolean
  isDefault: boolean
}

export type ModuleRow = BaseRow & {
  kind: 'module'
  projectId: string
  workspaceId: string
  moduleId: string
  hasSession: boolean
}

export type ActionRow = BaseRow & {
  kind: 'action'
  actionId: string
  target: HarbourContext
}

export type HarbourRow = ActionRow | ModuleRow | ProjectRow | WorkspaceRow
