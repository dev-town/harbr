import type { HarbourContext } from '@harbour/domain'
import { closeRuntime, openOrCreateRuntime } from '@harbour/runtime-tmux'
import { Effect } from 'effect'
import { join } from 'node:path'

import type { TuiServices, TuiStore } from '../app-context'
import type {
  ActiveRuntimeRow,
  ModuleRow,
  ProjectRow,
  WorkspaceRow,
} from '../types/rows'
import { saveUiContext } from '../data'
import { formatError } from '../helpers/errors'
import { loadProjects } from './refresh'

export async function persistContext(
  services: TuiServices,
  nextContext: HarbourContext,
) {
  try {
    await saveUiContext(nextContext, services.options.dbPath)
  } catch {
    // TODO: route persistence failures through observability once that package is wired into the TUI.
  }
}

export async function openProjectRoot(
  services: TuiServices,
  store: TuiStore,
  row: ProjectRow,
) {
  await openRuntimeForTarget(
    services,
    store,
    {
      projectName: row.label,
      workspaceName: null,
      moduleName: null,
      cwd: row.repoPath,
    },
    { projectId: row.projectId },
  )
}

export async function openWorkspaceRoot(
  services: TuiServices,
  store: TuiStore,
  row: WorkspaceRow,
) {
  const project = getSelectedProjectRow(store, row.projectId)

  if (!project) {
    store.getState().setNotice('Project not found', 'warning')
    return
  }

  await openRuntimeForTarget(
    services,
    store,
    {
      projectName: project.label,
      workspaceName: row.label,
      moduleName: null,
      cwd: row.workspacePath,
    },
    {
      projectId: row.projectId,
      workspaceId: row.workspaceId,
    },
  )
}

export async function openModuleRuntime(
  services: TuiServices,
  store: TuiStore,
  row: ModuleRow,
) {
  const project = getSelectedProjectRow(store, row.projectId)
  const workspace = getSelectedWorkspaceRow(store, row.workspaceId)

  if (!project || !workspace) {
    store.getState().setNotice('Workspace context missing', 'warning')
    return
  }

  await openRuntimeForTarget(
    services,
    store,
    {
      projectName: project.label,
      workspaceName: workspace.label,
      moduleName: row.label,
      cwd:
        row.modulePath === '.'
          ? workspace.workspacePath
          : join(workspace.workspacePath, row.modulePath),
    },
    {
      projectId: row.projectId,
      workspaceId: row.workspaceId,
      moduleId: row.moduleId,
    },
  )
}

export async function openActiveRuntime(
  services: TuiServices,
  store: TuiStore,
  row: ActiveRuntimeRow,
) {
  const cwd =
    row.scope === 'module'
      ? row.modulePath === '.'
        ? row.workspacePath
        : row.workspacePath && row.modulePath
          ? join(row.workspacePath, row.modulePath)
          : null
      : row.scope === 'workspace'
        ? row.workspacePath
        : row.repoPath

  if (!cwd) {
    store.getState().setNotice('Runtime path missing', 'warning')
    return
  }

  await openRuntimeForTarget(
    services,
    store,
    {
      projectName: row.projectLabel,
      workspaceName: row.workspaceLabel,
      moduleName: row.scope === 'module' ? row.label : null,
      cwd,
    },
    {
      projectId: row.projectId,
      ...(row.workspaceId ? { workspaceId: row.workspaceId } : {}),
      ...(row.scope === 'module' && row.moduleId
        ? { moduleId: row.moduleId }
        : {}),
    },
  )
}

export async function closeActiveRuntime(
  services: TuiServices,
  store: TuiStore,
  row: ActiveRuntimeRow,
) {
  if (
    row.isCurrent ||
    store.getState().app.currentRuntime?.sessionName === row.sessionName
  ) {
    store.getState().setNotice('Cannot close current session', 'warning')
    return
  }

  store.getState().setLoading(true)
  store.getState().clearNotice()

  try {
    await Effect.runPromise(closeRuntime(row.sessionName))
    store.getState().closeActionsMenu()
    await loadProjects(services, store)
  } catch (error) {
    store.getState().setNotice(formatError(error), 'error')
  } finally {
    store.getState().setLoading(false)
  }
}

export async function openRuntimeForTarget(
  services: TuiServices,
  store: TuiStore,
  target: {
    cwd: string
    moduleName: string | null
    projectName: string
    workspaceName: string | null
  },
  nextContext: HarbourContext,
) {
  store.getState().setLoading(true)
  store.getState().clearNotice()

  try {
    await persistContext(services, nextContext)
    await Effect.runPromise(openOrCreateRuntime(target))
    services.renderer.destroy()
  } catch (error) {
    store.getState().setNotice(formatError(error), 'error')
  } finally {
    store.getState().setLoading(false)
  }
}

function getSelectedProjectRow(store: TuiStore, projectId: string) {
  return (
    store
      .getState()
      .data.projectRows.find((row) => row.projectId === projectId) ?? null
  )
}

function getSelectedWorkspaceRow(store: TuiStore, workspaceId: string) {
  return (
    store
      .getState()
      .data.workspaceRows.find((row) => row.workspaceId === workspaceId) ?? null
  )
}
