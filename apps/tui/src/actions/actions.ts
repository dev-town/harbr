import type {
  ActionRow,
  ModuleRow,
  ProjectRow,
  WorkspaceRow,
} from '@harbour/domain'

import type { TuiServices, TuiStore } from '../app-context'
import {
  moduleRowsAtom,
  noticeAtom,
  openCreateWorkspaceFormAtom,
  projectRowsAtom,
  selectedActionRowAtom,
  workspaceRowsAtom,
} from '../state'
import {
  openModuleRuntime,
  openProjectRoot,
  openWorkspaceRoot,
} from './runtime'
import { actionIds } from './action-ids'

type SupportedContextRow = ModuleRow | ProjectRow | WorkspaceRow

export function handleActionSelect(services: TuiServices, store: TuiStore) {
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
    case actionIds.createWorkspace:
      {
        const project = getProjectRow(store, target.projectId)

        if (!project) {
          store.set(noticeAtom, 'Project context missing')
          return
        }

        store.set(openCreateWorkspaceFormAtom, project.projectId)
      }
      return
    case actionIds.openProjectRoot:
      {
        const project = getProjectRow(store, target.projectId)

        if (!project) {
          store.set(noticeAtom, 'Project context missing')
          return
        }

        void openProjectRoot(services, store, project)
      }
      return
    case actionIds.openWorkspaceRoot:
      if (target.kind !== 'workspace' && target.kind !== 'module') {
        store.set(noticeAtom, 'Workspace context missing')
        return
      }

      {
        const workspace =
          target.kind === 'workspace'
            ? target
            : getWorkspaceRow(store, target.workspaceId)

        if (!workspace) {
          store.set(noticeAtom, 'Workspace context missing')
          return
        }

        void openWorkspaceRoot(services, store, workspace)
      }
      return
    case actionIds.openModuleSession:
      if (target.kind !== 'module') {
        store.set(noticeAtom, 'Module context missing')
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
  if (row.target.moduleId) {
    return store.get(moduleRowsAtom).find((item) => item.moduleId === row.target.moduleId) ?? null
  }

  if (row.target.workspaceId) {
    return getWorkspaceRow(store, row.target.workspaceId)
  }

  return row.target.projectId ? getProjectRow(store, row.target.projectId) : null
}

function getProjectRow(store: TuiStore, projectId: string) {
  return store.get(projectRowsAtom).find((row) => row.projectId === projectId) ?? null
}

function getWorkspaceRow(store: TuiStore, workspaceId: string) {
  return store.get(workspaceRowsAtom).find((row) => row.workspaceId === workspaceId) ?? null
}
