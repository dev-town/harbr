import type { TuiServices, TuiStore } from '../../../app-context'
import { openDefaultWorkspaceModules, openModules, openWorkspaces } from '../../../actions/drilldown'
import { openModuleRuntime, openProjectRoot, openWorkspaceRoot } from '../../../actions/runtime'
import { actionIds } from '../../../actions/action-ids'
import { noticeAtom } from '../../../state/app'
import { moduleRowsAtom, projectRowsAtom, workspaceRowsAtom } from '../../../state/rows'
import type { ActionRow, HarbourRow, ModuleRow, ProjectRow, WorkspaceRow } from '../../../types/rows'
import { openCreateWorkspaceFormAtom } from '../state/actions'
import { selectedActionRowAtom } from '../state/derived'

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

export function handleBrowseActionSelect(services: TuiServices, store: TuiStore) {
  const row = store.get(selectedActionRowAtom)

  if (!row || row.kind !== 'action') {
    return
  }

  const target = resolveActionTarget(store, row)

  if (!target) {
    store.set(noticeAtom, 'Action target missing')
    return
  }

  switch (row.actionId) {
    case actionIds.createWorkspace: {
      const project = getProjectTarget(store, target)

      if (!project) {
        store.set(noticeAtom, 'Project context missing')
        return
      }

      store.set(openCreateWorkspaceFormAtom, project.projectId)
      return
    }
    case actionIds.openProjectRoot: {
      const project = getProjectTarget(store, target)

      if (!project) {
        store.set(noticeAtom, 'Project context missing')
        return
      }

      void openProjectRoot(services, store, project)
      return
    }
    case actionIds.openWorkspaceRoot: {
      if (target.kind !== 'workspace' && target.kind !== 'module') {
        store.set(noticeAtom, 'Workspace context missing')
        return
      }

      const workspace =
        target.kind === 'workspace'
          ? target
          : store.get(workspaceRowsAtom).find((item) => item.workspaceId === target.workspaceId) ?? null

      if (!workspace) {
        store.set(noticeAtom, 'Workspace context missing')
        return
      }

      void openWorkspaceRoot(services, store, workspace)
      return
    }
    case actionIds.openModuleSession:
      if (target.kind !== 'module') {
        store.set(noticeAtom, 'Module context missing')
        return
      }

      void openModuleRuntime(services, store, target)
      return
  }
}

function resolveActionTarget(store: TuiStore, row: ActionRow): SupportedContextRow | null {
  if (row.target.moduleId) {
    return store.get(moduleRowsAtom).find((item) => item.moduleId === row.target.moduleId) ?? null
  }

  if (row.target.workspaceId) {
    return store.get(workspaceRowsAtom).find((item) => item.workspaceId === row.target.workspaceId) ?? null
  }

  if (!row.target.projectId) {
    return null
  }

  return store.get(projectRowsAtom).find((item) => item.projectId === row.target.projectId) ?? null
}

function getProjectTarget(store: TuiStore, target: SupportedContextRow) {
  if (target.kind === 'project') {
    return target
  }

  return store.get(projectRowsAtom).find((item) => item.projectId === target.projectId) ?? null
}
