import type {
  ActiveRuntimeSummary,
  ModuleSummary,
  ProjectSummary,
  WorkspaceSummary,
} from '@harbour/domain'

import type { ActiveRuntimeRow, ModuleRow, ProjectRow, WorkspaceRow } from '../types/rows'

export function mapProjectSummaryToRow(summary: ProjectSummary): ProjectRow {
  const projectIssue = summary.projectIssue ?? null

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
    projectIssue,
    repoPath: summary.repoPath,
  }
}

export function mapWorkspaceSummaryToRow(summary: WorkspaceSummary): WorkspaceRow {
  const branchName = summary.branchName ?? null

  return {
    id: summary.id,
    kind: 'workspace',
    label: summary.name,
    projectId: summary.projectId,
    workspaceId: summary.id,
    isActive: summary.activeSessionCount > 0,
    metadata: formatWorkspaceMetadata(branchName, summary.activeSessionCount),
    activeSessionCount: summary.activeSessionCount,
    branchName,
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

export function mapActiveRuntimeSummaryToRow(summary: ActiveRuntimeSummary): ActiveRuntimeRow {
  return {
    contextLabel: getActiveRuntimeContextLabel(summary),
    id: summary.id,
    isCurrent: false,
    label: getActiveRuntimeLabel(summary),
    moduleId: summary.moduleId,
    moduleLabel: summary.moduleName,
    modulePath: summary.modulePath,
    projectId: summary.projectId,
    projectLabel: summary.projectName,
    repoPath: summary.repoPath,
    scope: summary.scope,
    sessionName: summary.sessionName,
    status: summary.status,
    workspaceId: summary.workspaceId,
    workspaceLabel: summary.workspaceName,
    workspacePath: summary.workspacePath,
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

function formatWorkspaceMetadata(branchName: string | null, activeSessionCount: number) {
  const sessionMetadata = formatSessionMetadata(activeSessionCount)

  if (!branchName) {
    return sessionMetadata
  }

  return `${branchName} · ${sessionMetadata}`
}

function getActiveRuntimeLabel(summary: ActiveRuntimeSummary) {
  if (summary.scope === 'module') {
    return summary.moduleName ?? summary.workspaceName ?? summary.projectName
  }

  if (summary.scope === 'workspace') {
    return summary.workspaceName ?? summary.projectName
  }

  return summary.projectName
}

function getActiveRuntimeContextLabel(summary: ActiveRuntimeSummary) {
  if (summary.scope === 'module') {
    return [summary.projectName, summary.workspaceName, summary.moduleName].filter(Boolean).join(' › ')
  }

  if (summary.scope === 'workspace') {
    return [summary.projectName, summary.workspaceName].filter(Boolean).join(' › ')
  }

  return summary.projectName
}
