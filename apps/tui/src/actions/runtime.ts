import type { HarbourContext, ModuleRow, ProjectRow, WorkspaceRow } from '@harbour/domain'
import { openOrCreateRuntime } from '@harbour/runtime-tmux'
import { Effect } from 'effect'
import { join } from 'node:path'

import type { TuiAppContext } from '../app-context'
import { saveUiContext } from '../data'
import { formatError } from '../helpers/errors'
import { noticeAtom, projectRowsAtom, workspaceRowsAtom } from '../state'
import { clearNotice, setLoading } from './state'

export async function persistContext(context: TuiAppContext, nextContext: HarbourContext) {
  try {
    await saveUiContext(nextContext, context.options.dbPath)
  } catch {
    // TODO: route persistence failures through observability once that package is wired into the TUI.
  }
}

export async function openProjectRoot(context: TuiAppContext, row: ProjectRow) {
  await openRuntimeForTarget(
    context,
    {
      projectName: row.label,
      workspaceName: null,
      moduleName: null,
      cwd: row.repoPath,
    },
    { projectId: row.projectId },
  )
}

export async function openWorkspaceRoot(context: TuiAppContext, row: WorkspaceRow) {
  const project = getSelectedProjectRow(context, row.projectId)

  if (!project) {
    context.store.set(noticeAtom, 'Project not found')
    return
  }

  await openRuntimeForTarget(
    context,
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

export async function openModuleRuntime(context: TuiAppContext, row: ModuleRow) {
  const project = getSelectedProjectRow(context, row.projectId)
  const workspace = getSelectedWorkspaceRow(context, row.workspaceId)

  if (!project || !workspace) {
    context.store.set(noticeAtom, 'Workspace context missing')
    return
  }

  await openRuntimeForTarget(
    context,
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
  context: TuiAppContext,
  target: {
    cwd: string
    moduleName: string | null
    projectName: string
    workspaceName: string | null
  },
  nextContext: HarbourContext,
) {
  setLoading(context, true)
  clearNotice(context)

  try {
    await persistContext(context, nextContext)
    await Effect.runPromise(openOrCreateRuntime(target))
    context.renderer.destroy()
  } catch (error) {
    context.store.set(noticeAtom, formatError(error))
  } finally {
    setLoading(context, false)
  }
}

function getSelectedProjectRow(context: TuiAppContext, projectId: string) {
  return context.store.get(projectRowsAtom).find((row) => row.projectId === projectId) ?? null
}

function getSelectedWorkspaceRow(context: TuiAppContext, workspaceId: string) {
  return context.store.get(workspaceRowsAtom).find((row) => row.workspaceId === workspaceId) ?? null
}
