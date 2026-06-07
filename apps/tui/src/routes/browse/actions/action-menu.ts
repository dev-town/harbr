import type { TuiServices, TuiStore } from '../../../app-context'
import {
  openDefaultWorkspaceModules,
  openModules,
  openWorkspaces,
} from '../../../actions/drilldown'
import {
  closeActiveRuntime,
  openModuleRuntime,
  openProjectRoot,
  openWorkspaceRoot,
} from '../../../actions/runtime'
import { browseActionIds } from '../../../store'
import type {
  ActionRow,
  HarbourRow,
  ModuleRow,
  ProjectRow,
  WorkspaceRow,
} from '../../../types/rows'

type SupportedContextRow = ModuleRow | ProjectRow | WorkspaceRow

export function handleBrowseRouteSelect(
  services: TuiServices,
  store: TuiStore,
  row: HarbourRow | null,
) {
  if (!row) {
    return
  }

  if (row.kind === 'workspace') {
    if (row.hasModules) {
      void openModules(services, store, row.projectId, row.workspaceId)
      return
    }

    void openWorkspaceRoot(services, store, row)
    return
  }

  if (row.kind !== 'project') {
    if (row.kind === 'module') {
      void openModuleRuntime(services, store, row)
    }

    return
  }

  if (row.hasWorkspaces) {
    void openWorkspaces(services, store, row.projectId)
    return
  }

  if (row.hasModules) {
    void openDefaultWorkspaceModules(services, store, row.projectId)
    return
  }

  void openProjectRoot(services, store, row)
}

export function handleBrowseActionSelect(
  services: TuiServices,
  store: TuiStore,
  row: ActionRow | null,
) {
  if (!row || row.kind !== 'action') {
    return
  }

  const target = resolveActionTarget(store, row)

  if (!target) {
    store.getState().setNotice('Action target missing', 'warning')
    return
  }

  switch (row.actionId) {
    case browseActionIds.closeRuntimeSession: {
      if (row.disabledNotice) {
        store.getState().setNotice(row.disabledNotice, 'warning')
        return
      }

      if (!target.runtime) {
        store.getState().setNotice('Session context missing', 'warning')
        return
      }

      void closeActiveRuntime(services, store, {
        ...target,
        runtime: target.runtime,
      })
      return
    }
    case browseActionIds.createWorkspace: {
      const project = getProjectTarget(store, target)

      if (!project) {
        store.getState().setNotice('Project context missing', 'warning')
        return
      }

      store.getState().openCreateWorkspaceForm(project.projectId)
      return
    }
    case browseActionIds.createModuleWindows:
    case browseActionIds.createProjectWindows:
    case browseActionIds.createWorkspaceWindows:
      store.getState().openWindowPicker(row.target)
      return
    case browseActionIds.openProjectRoot: {
      const project = getProjectTarget(store, target)

      if (!project) {
        store.getState().setNotice('Project context missing', 'warning')
        return
      }

      void openProjectRoot(services, store, project)
      return
    }
    case browseActionIds.openWorkspaceRoot: {
      if (target.kind !== 'workspace' && target.kind !== 'module') {
        store.getState().setNotice('Workspace context missing', 'warning')
        return
      }

      const workspace =
        target.kind === 'workspace'
          ? target
          : (store
              .getState()
              .data.workspaceRows.find(
                (item) => item.workspaceId === target.workspaceId,
              ) ?? null)

      if (!workspace) {
        store.getState().setNotice('Workspace context missing', 'warning')
        return
      }

      void openWorkspaceRoot(services, store, workspace)
      return
    }
    case browseActionIds.openModuleSession:
      if (target.kind !== 'module') {
        store.getState().setNotice('Module context missing', 'warning')
        return
      }

      void openModuleRuntime(services, store, target)
      return
  }
}

function resolveActionTarget(
  store: TuiStore,
  row: ActionRow,
): SupportedContextRow | null {
  const context = row.target.context

  if (context.moduleId) {
    return (
      store
        .getState()
        .data.moduleRows.find((item) => item.moduleId === context.moduleId) ??
      null
    )
  }

  if (context.workspaceId) {
    return (
      store
        .getState()
        .data.workspaceRows.find(
          (item) => item.workspaceId === context.workspaceId,
        ) ?? null
    )
  }

  if (!context.projectId) {
    return null
  }

  return (
    store
      .getState()
      .data.projectRows.find((item) => item.projectId === context.projectId) ??
    null
  )
}

function getProjectTarget(store: TuiStore, target: SupportedContextRow) {
  if (target.kind === 'project') {
    return target
  }

  return (
    store
      .getState()
      .data.projectRows.find((item) => item.projectId === target.projectId) ??
    null
  )
}
