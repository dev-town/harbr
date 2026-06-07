import type { HarbourContext, WindowConfig } from '@harbour/domain'
import { createRuntimeWindows } from '@harbour/runtime-tmux'
import { Effect } from 'effect'
import { join } from 'node:path'

import type { TuiServices, TuiStore } from '../app-context'
import { formatError } from '../helpers/errors'
import { persistContext } from './runtime'

export async function createWindowsForContext(
  services: TuiServices,
  store: TuiStore,
  context: HarbourContext,
  windows: readonly WindowConfig[],
) {
  const target = resolveRuntimeTarget(store, context)

  if (!target) {
    store.getState().setNotice('Runtime context missing', 'warning')
    return
  }

  store.getState().setLoading(true)
  store.getState().clearNotice()

  try {
    await persistContext(services, context)
    const result = await Effect.runPromise(
      createRuntimeWindows({ target, windows }),
    )

    if (result.createdWindowNames.length === 0) {
      store.getState().setNotice('Windows already exist', 'warning')
      return
    }

    store.getState().closeActionsMenu()
    services.renderer.destroy()
  } catch (error) {
    store.getState().setNotice(formatError(error), 'error')
  } finally {
    store.getState().setLoading(false)
  }
}

function resolveRuntimeTarget(store: TuiStore, context: HarbourContext) {
  const state = store.getState()
  const project = state.data.projectRows.find(
    (row) => row.projectId === context.projectId,
  )

  if (!project) {
    return null
  }

  if (!context.workspaceId) {
    return {
      cwd: project.repoPath,
      moduleName: null,
      projectName: project.label,
      workspaceName: null,
    }
  }

  const workspace = state.data.workspaceRows.find(
    (row) => row.workspaceId === context.workspaceId,
  )

  if (!workspace) {
    return null
  }

  if (!context.moduleId) {
    return {
      cwd: workspace.workspacePath,
      moduleName: null,
      projectName: project.label,
      workspaceName: workspace.label,
    }
  }

  const module = state.data.moduleRows.find(
    (row) => row.moduleId === context.moduleId,
  )

  if (!module) {
    return null
  }

  return {
    cwd:
      module.modulePath === '.'
        ? workspace.workspacePath
        : join(workspace.workspacePath, module.modulePath),
    moduleName: module.label,
    projectName: project.label,
    workspaceName: workspace.label,
  }
}
