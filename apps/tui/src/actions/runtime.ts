import type {
  HarbourContext,
  RuntimeAttachment,
  RuntimeTarget,
} from '@harbour/domain'
import { closeRuntime, openOrCreateRuntime } from '@harbour/runtime-tmux'
import { Effect } from 'effect'

import type { TuiServices, TuiStore } from '../app-context'
import type {
  HarbourRow,
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
    row.target.runtimeTarget,
    row.target.context,
  )
}

export async function openWorkspaceRoot(
  services: TuiServices,
  store: TuiStore,
  row: WorkspaceRow,
) {
  await openRuntimeForTarget(
    services,
    store,
    row.target.runtimeTarget,
    row.target.context,
  )
}

export async function openModuleRuntime(
  services: TuiServices,
  store: TuiStore,
  row: ModuleRow,
) {
  await openRuntimeForTarget(
    services,
    store,
    row.target.runtimeTarget,
    row.target.context,
  )
}

export async function openActiveRuntime(
  services: TuiServices,
  store: TuiStore,
  row: HarbourRow & { runtime: RuntimeAttachment },
) {
  await openRuntimeForTarget(
    services,
    store,
    row.target.runtimeTarget,
    row.target.context,
  )
}

export async function closeActiveRuntime(
  services: TuiServices,
  store: TuiStore,
  row: HarbourRow & { runtime: RuntimeAttachment },
) {
  if (
    row.isCurrent ||
    store.getState().app.currentRuntime?.sessionName === row.runtime.sessionName
  ) {
    store.getState().setNotice('Cannot close current session', 'warning')
    return
  }

  store.getState().setLoading(true)
  store.getState().clearNotice()

  try {
    await Effect.runPromise(closeRuntime(row.runtime.sessionName))
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
  target: RuntimeTarget,
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
