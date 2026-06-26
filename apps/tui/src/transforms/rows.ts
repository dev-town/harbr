import type {
  ActiveRuntimeSummary,
  ModuleSummary,
  ProjectSummary,
  WorkspaceSummary,
} from '@harbr/domain'
import { join } from 'node:path'

import type {
  HarbourRow,
  ModuleRow,
  ProjectRow,
  WorkspaceRow,
} from '~/types/rows'

export function mapProjectSummaryToRow(summary: ProjectSummary): ProjectRow {
  const projectIssue = summary.projectIssue ?? null

  return {
    id: summary.id,
    kind: 'project',
    label: summary.name,
    projectId: summary.id,
    isActive: summary.activeSessionCount > 0,
    isCurrent: false,
    metadata: formatSessionMetadata(summary.activeSessionCount),
    activeSessionCount: summary.activeSessionCount,
    hasModules: summary.hasModules,
    hasWorkspaces: summary.hasWorkspaces,
    projectIssue,
    repoPath: summary.repoPath,
    runtime: summary.runtime,
    target: {
      breadcrumb: summary.name,
      context: { projectId: summary.id },
      label: summary.name,
      runtimeTarget: {
        cwd: summary.repoPath,
        moduleName: null,
        projectName: summary.name,
        workspaceName: null,
      },
      scope: 'project',
    },
  }
}

export function mapWorkspaceSummaryToRow(
  summary: WorkspaceSummary,
): WorkspaceRow {
  const branchName = summary.branchName ?? null

  return {
    id: summary.id,
    kind: 'workspace',
    label: summary.name,
    projectId: summary.projectId,
    workspaceId: summary.id,
    isActive: summary.activeSessionCount > 0,
    isCurrent: false,
    metadata: formatWorkspaceMetadata(branchName, summary.activeSessionCount),
    activeSessionCount: summary.activeSessionCount,
    branchName,
    hasModules: summary.hasModules,
    isDefault: summary.isDefault,
    runtime: summary.runtime,
    target: {
      breadcrumb: [summary.projectName, summary.name].join(' › '),
      context: { projectId: summary.projectId, workspaceId: summary.id },
      label: summary.name,
      runtimeTarget: {
        cwd: summary.workspacePath,
        moduleName: null,
        projectName: summary.projectName,
        workspaceName: summary.name,
      },
      scope: 'workspace',
    },
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
    isCurrent: false,
    metadata: summary.hasActiveSession ? 'session' : 'no session',
    hasSession: summary.hasActiveSession,
    modulePath: summary.path,
    runtime: summary.runtime,
    target: {
      breadcrumb: [
        summary.projectName,
        summary.workspaceName,
        summary.name,
      ].join(' › '),
      context: {
        projectId: summary.projectId,
        workspaceId: summary.workspaceId,
        moduleId: summary.id,
      },
      label: summary.name,
      runtimeTarget: {
        cwd:
          summary.path === '.'
            ? summary.workspacePath
            : join(summary.workspacePath, summary.path),
        moduleName: summary.name,
        projectName: summary.projectName,
        workspaceName: summary.workspaceName,
      },
      scope: 'module',
    },
  }
}

export function mapActiveRuntimeSummaryToRow(
  summary: ActiveRuntimeSummary,
): HarbourRow {
  const runtime = { sessionName: summary.sessionName, status: summary.status }

  if (summary.scope === 'project') {
    return {
      id: summary.id,
      kind: 'project',
      label: summary.projectName,
      projectId: summary.projectId,
      isActive: true,
      isCurrent: false,
      metadata: summary.status,
      activeSessionCount: 1,
      hasModules: false,
      hasWorkspaces: false,
      projectIssue: null,
      repoPath: summary.repoPath,
      runtime,
      target: {
        breadcrumb: summary.projectName,
        context: { projectId: summary.projectId },
        label: summary.projectName,
        runtimeTarget: {
          cwd: summary.repoPath,
          moduleName: null,
          projectName: summary.projectName,
          workspaceName: null,
        },
        scope: 'project',
      },
    }
  }

  if (summary.scope === 'workspace') {
    return {
      id: summary.id,
      kind: 'workspace',
      label: summary.workspaceName ?? summary.projectName,
      projectId: summary.projectId,
      workspaceId: summary.workspaceId ?? '',
      isActive: true,
      isCurrent: false,
      metadata: summary.status,
      activeSessionCount: 1,
      branchName: null,
      hasModules: false,
      isDefault: false,
      runtime,
      target: {
        breadcrumb: getActiveRuntimeContextLabel(summary),
        context: {
          projectId: summary.projectId,
          ...(summary.workspaceId ? { workspaceId: summary.workspaceId } : {}),
        },
        label: summary.workspaceName ?? summary.projectName,
        runtimeTarget: {
          cwd: summary.workspacePath ?? summary.repoPath,
          moduleName: null,
          projectName: summary.projectName,
          workspaceName: summary.workspaceName,
        },
        scope: 'workspace',
      },
      workspacePath: summary.workspacePath ?? summary.repoPath,
    }
  }

  return {
    id: summary.id,
    kind: 'module',
    label: summary.moduleName ?? summary.workspaceName ?? summary.projectName,
    projectId: summary.projectId,
    workspaceId: summary.workspaceId ?? '',
    moduleId: summary.moduleId ?? '',
    isActive: true,
    isCurrent: false,
    metadata: summary.status,
    hasSession: true,
    modulePath: summary.modulePath ?? '.',
    runtime,
    target: {
      breadcrumb: getActiveRuntimeContextLabel(summary),
      context: {
        projectId: summary.projectId,
        ...(summary.workspaceId ? { workspaceId: summary.workspaceId } : {}),
        ...(summary.moduleId ? { moduleId: summary.moduleId } : {}),
      },
      label: summary.moduleName ?? summary.workspaceName ?? summary.projectName,
      runtimeTarget: {
        cwd:
          summary.modulePath === '.'
            ? (summary.workspacePath ?? summary.repoPath)
            : summary.workspacePath && summary.modulePath
              ? join(summary.workspacePath, summary.modulePath)
              : summary.repoPath,
        moduleName: summary.moduleName,
        projectName: summary.projectName,
        workspaceName: summary.workspaceName,
      },
      scope: 'module',
    },
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

function formatWorkspaceMetadata(
  branchName: string | null,
  activeSessionCount: number,
) {
  const sessionMetadata = formatSessionMetadata(activeSessionCount)

  if (!branchName) {
    return sessionMetadata
  }

  return `${branchName} · ${sessionMetadata}`
}

function getActiveRuntimeContextLabel(summary: ActiveRuntimeSummary) {
  if (summary.scope === 'module') {
    return [summary.projectName, summary.workspaceName, summary.moduleName]
      .filter(Boolean)
      .join(' › ')
  }

  if (summary.scope === 'workspace') {
    return [summary.projectName, summary.workspaceName]
      .filter(Boolean)
      .join(' › ')
  }

  return summary.projectName
}
