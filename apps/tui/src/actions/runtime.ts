import type { HarbourContext } from '@harbour/domain'
import { openOrCreateRuntime } from '@harbour/runtime-tmux'
import { Effect } from 'effect'
import { join } from 'node:path'

import type { TuiServices, TuiStore } from '../app-context'
import type { ModuleRow, ProjectRow, WorkspaceRow } from '../types/rows'
import { saveUiContext } from '../data'
import { formatError } from '../helpers/errors'
import { noticeAtom, projectRowsAtom, workspaceRowsAtom } from '../state'
import { clearNotice, setLoading } from './store'

export async function persistContext(services: TuiServices, nextContext: HarbourContext) {
  try {
    await saveUiContext(nextContext, services.options.dbPath)
  } catch {
    // TODO: route persistence failures through observability once that package is wired into the TUI.
  }
}

export async function openProjectRoot(services: TuiServices, store: TuiStore, row: ProjectRow) {
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

export async function openWorkspaceRoot(services: TuiServices, store: TuiStore, row: WorkspaceRow) {
  const project = getSelectedProjectRow(store, row.projectId)

  if (!project) {
    store.set(noticeAtom, 'Project not found')
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

export async function openModuleRuntime(services: TuiServices, store: TuiStore, row: ModuleRow) {
  const project = getSelectedProjectRow(store, row.projectId)
  const workspace = getSelectedWorkspaceRow(store, row.workspaceId)

  if (!project || !workspace) {
    store.set(noticeAtom, 'Workspace context missing')
    return
  }

  await openRuntimeForTarget(
    services,
    store,
    {
      projectName: project.label,
      workspaceName: workspace.label,
      moduleName: row.label,
      cwd: row.modulePath === '.' ? workspace.workspacePath : join(workspace.workspacePath, row.modulePath),
    },
    {
      projectId: row.projectId,
      workspaceId: row.workspaceId,
      moduleId: row.moduleId,
    },
  )
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
  setLoading(store, true)
  clearNotice(store)

  try {
    await persistContext(services, nextContext)
    await Effect.runPromise(openOrCreateRuntime(target))
    services.renderer.destroy()
  } catch (error) {
    store.set(noticeAtom, formatError(error))
  } finally {
    setLoading(store, false)
  }
}

function getSelectedProjectRow(store: TuiStore, projectId: string) {
  return store.get(projectRowsAtom).find((row) => row.projectId === projectId) ?? null
}

function getSelectedWorkspaceRow(store: TuiStore, workspaceId: string) {
  return store.get(workspaceRowsAtom).find((row) => row.workspaceId === workspaceId) ?? null
}
