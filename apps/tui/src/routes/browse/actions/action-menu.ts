import type { TuiServices, TuiStore } from '../../../app-context'
import { openDefaultWorkspaceModules, openModules, openWorkspaces } from '../../../actions/drilldown'
import { openModuleRuntime, openProjectRoot, openWorkspaceRoot } from '../../../actions/runtime'
import { browseActionIds } from '../../../store'
import type { ActionRow, HarbourRow, ModuleRow, ProjectRow, WorkspaceRow } from '../../../types/rows'

type SupportedContextRow = ModuleRow | ProjectRow | WorkspaceRow

export function handleBrowseRouteSelect(services: TuiServices, store: TuiStore, row: HarbourRow | null) {
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

export function handleBrowseActionSelect(services: TuiServices, store: TuiStore, row: ActionRow | null) {
  if (!row || row.kind !== 'action') {
    return
  }

  const target = resolveActionTarget(store, row)

  if (!target) {
    store.getState().setNotice('Action target missing')
    return
  }

  switch (row.actionId) {
    case browseActionIds.createWorkspace: {
      const project = getProjectTarget(store, target)

      if (!project) {
        store.getState().setNotice('Project context missing')
        return
      }

      store.getState().openCreateWorkspaceForm(project.projectId)
      return
    }
    case browseActionIds.openProjectRoot: {
      const project = getProjectTarget(store, target)

      if (!project) {
        store.getState().setNotice('Project context missing')
        return
      }

      void openProjectRoot(services, store, project)
      return
    }
    case browseActionIds.openWorkspaceRoot: {
      if (target.kind !== 'workspace' && target.kind !== 'module') {
        store.getState().setNotice('Workspace context missing')
        return
      }

      const workspace =
        target.kind === 'workspace'
          ? target
          : store.getState().data.workspaceRows.find((item) => item.workspaceId === target.workspaceId) ?? null

      if (!workspace) {
        store.getState().setNotice('Workspace context missing')
        return
      }

      void openWorkspaceRoot(services, store, workspace)
      return
    }
    case browseActionIds.openModuleSession:
      if (target.kind !== 'module') {
        store.getState().setNotice('Module context missing')
        return
      }

      void openModuleRuntime(services, store, target)
      return
  }
}

function resolveActionTarget(store: TuiStore, row: ActionRow): SupportedContextRow | null {
  if (row.target.moduleId) {
    return store.getState().data.moduleRows.find((item) => item.moduleId === row.target.moduleId) ?? null
  }

  if (row.target.workspaceId) {
    return store.getState().data.workspaceRows.find((item) => item.workspaceId === row.target.workspaceId) ?? null
  }

  if (!row.target.projectId) {
    return null
  }

  return store.getState().data.projectRows.find((item) => item.projectId === row.target.projectId) ?? null
}

function getProjectTarget(store: TuiStore, target: SupportedContextRow) {
  if (target.kind === 'project') {
    return target
  }

  return store.getState().data.projectRows.find((item) => item.projectId === target.projectId) ?? null
}
