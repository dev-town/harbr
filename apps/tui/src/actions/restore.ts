import type { HarbourContext, ProjectSummary } from '@harbr/domain'

import type { TuiServices, TuiStore } from '~/app-context'
import { listWorkspaceSummaries, loadCurrentRuntime } from '~/data'
import { workspacesScope } from '~/store'
import { mapWorkspaceSummaryToRow } from '~/transforms'
import {
  openDefaultWorkspaceModules,
  openModules,
  openWorkspaces,
} from './drilldown'

export async function restoreUiContext(
  services: TuiServices,
  store: TuiStore,
  savedContext: HarbourContext,
  projects: readonly ProjectSummary[],
) {
  const project = savedContext.projectId
    ? projects.find((candidate) => candidate.id === savedContext.projectId)
    : undefined

  if (!project) {
    return
  }

  store.setState((state) => ({
    browse: {
      ...state.browse,
      list: { ...state.browse.list, selectedId: project.id },
    },
  }))

  if (savedContext.workspaceId && project.hasModules) {
    // TODO: prefer workspaces view instead when sticky context points at a project that no longer has module config.
    await openModules(services, store, project.id, savedContext.workspaceId)

    if (savedContext.moduleId) {
      const moduleRow = store
        .getState()
        .data.moduleRows.find((row) => row.moduleId === savedContext.moduleId)

      if (moduleRow) {
        store.setState((state) => ({
          browse: {
            ...state.browse,
            list: { ...state.browse.list, selectedId: moduleRow.id },
          },
        }))
      }
    }

    return
  }

  if (project.hasWorkspaces) {
    await openWorkspaces(services, store, project.id)

    if (savedContext.workspaceId) {
      const workspaceRow = store
        .getState()
        .data.workspaceRows.find(
          (row) => row.workspaceId === savedContext.workspaceId,
        )

      if (workspaceRow) {
        store.setState((state) => ({
          browse: {
            ...state.browse,
            list: { ...state.browse.list, selectedId: workspaceRow.id },
          },
        }))
      }
    }

    return
  }

  if (project.hasModules) {
    await openDefaultWorkspaceModules(services, store, project.id)
  }
}

export async function restoreCurrentRuntime(
  services: TuiServices,
  store: TuiStore,
  currentRuntime: Awaited<ReturnType<typeof loadCurrentRuntime>>,
  projects: readonly ProjectSummary[],
) {
  if (!currentRuntime) {
    return false
  }

  const project = projects.find(
    (candidate) => candidate.name === currentRuntime.projectName,
  )

  if (!project) {
    return false
  }

  store.setState((state) => ({
    browse: {
      ...state.browse,
      list: { ...state.browse.list, selectedId: project.id },
    },
  }))

  if (currentRuntime.scope === 'project') {
    return true
  }

  const workspaces = await listWorkspaceSummaries(services, project.id)
  const workspace = currentRuntime.workspaceName
    ? workspaces.find(
        (candidate) => candidate.name === currentRuntime.workspaceName,
      )
    : undefined

  if (!workspace) {
    return false
  }

  store.setState((state) => ({
    browse: { ...state.browse, scope: workspacesScope(project.id) },
    data: {
      ...state.data,
      workspaceRows: workspaces.map(mapWorkspaceSummaryToRow),
    },
  }))

  store.setState((state) => ({
    browse: {
      ...state.browse,
      list: { ...state.browse.list, selectedId: workspace.id },
    },
  }))

  if (currentRuntime.scope === 'workspace') {
    return true
  }

  await openModules(services, store, project.id, workspace.id, {
    implicitWorkspace: workspace.isDefault && !project.hasWorkspaces,
    workspaceSummaries: workspaces,
  })

  const moduleRows = store.getState().data.moduleRows
  const moduleRow = moduleRows.find(
    (row) => row.label === currentRuntime.moduleName,
  )

  if (moduleRow) {
    store.setState((state) => ({
      browse: {
        ...state.browse,
        list: { ...state.browse.list, selectedId: moduleRow.id },
      },
    }))
    return true
  }

  return false
}
