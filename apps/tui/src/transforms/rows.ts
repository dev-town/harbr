import type { ModuleRow, ModuleSummary, ProjectRow, ProjectSummary, WorkspaceRow, WorkspaceSummary } from '@harbour/domain'

export function mapProjectSummaryToRow(summary: ProjectSummary): ProjectRow {
  return {
    id: summary.id,
    kind: 'project',
    label: summary.name,
    projectId: summary.id,
    isActive: summary.activeSessionCount > 0,
    metadata: formatSessionMetadata(summary.activeSessionCount),
    activeSessionCount: summary.activeSessionCount,
    hasModules: summary.hasModules,
    hasWorkspaces: summary.hasWorkspaces,
    repoPath: summary.repoPath,
  }
}

export function mapWorkspaceSummaryToRow(summary: WorkspaceSummary): WorkspaceRow {
  return {
    id: summary.id,
    kind: 'workspace',
    label: summary.name,
    projectId: summary.projectId,
    workspaceId: summary.id,
    isActive: summary.activeSessionCount > 0,
    metadata: formatSessionMetadata(summary.activeSessionCount),
    activeSessionCount: summary.activeSessionCount,
    hasModules: summary.hasModules,
    isDefault: summary.isDefault,
    workspacePath: summary.workspacePath,
  }
}

export function mapModuleSummaryToRow(summary: ModuleSummary): ModuleRow {
  return {
    id: summary.id,
    kind: 'module',
    label: summary.name,
    projectId: summary.projectId,
    workspaceId: summary.workspaceId,
    moduleId: summary.id,
    isActive: summary.hasActiveSession,
    metadata: summary.hasActiveSession ? 'session' : 'no session',
    hasSession: summary.hasActiveSession,
    modulePath: summary.path,
  }
}

function formatSessionMetadata(activeSessionCount: number) {
  if (activeSessionCount === 0) {
    return 'no sessions'
  }

  if (activeSessionCount === 1) {
    return '1 session'
  }

  return `${activeSessionCount} sessions`
}
