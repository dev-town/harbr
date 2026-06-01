import type { HarbourContext, ProjectSummary } from '@harbour/domain'

import type { TuiServices, TuiStore } from '../app-context'
import { listWorkspaceSummaries, loadCurrentRuntime } from '../data'
import { currentSectionAtom, moduleRowsAtom, selectedBrowseRowIdAtom, selectedProjectIdAtom, workspaceRowsAtom } from '../state'
import { mapWorkspaceSummaryToRow } from '../transforms'
import { openDefaultWorkspaceModules, openModules, openWorkspaces } from './drilldown'

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

  store.set(selectedBrowseRowIdAtom, project.id)

  if (savedContext.workspaceId && project.hasModules) {
    // TODO: prefer workspaces view instead when sticky context points at a project that no longer has module config.
    await openModules(services, store, project.id, savedContext.workspaceId)

    if (savedContext.moduleId) {
      const moduleRow = store.get(moduleRowsAtom).find((row) => row.moduleId === savedContext.moduleId)

      if (moduleRow) {
        store.set(selectedBrowseRowIdAtom, moduleRow.id)
      }
    }

    return
  }

  if (project.hasWorkspaces) {
    await openWorkspaces(services, store, project.id)

    if (savedContext.workspaceId) {
      const workspaceRow = store.get(workspaceRowsAtom).find((row) => row.workspaceId === savedContext.workspaceId)

      if (workspaceRow) {
        store.set(selectedBrowseRowIdAtom, workspaceRow.id)
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

  const project = projects.find((candidate) => candidate.name === currentRuntime.projectName)

  if (!project) {
    return false
  }

  store.set(selectedBrowseRowIdAtom, project.id)

  if (currentRuntime.scope === 'project') {
    return true
  }

  const workspaces = await listWorkspaceSummaries(project.id, services.options.dbPath)
  const workspace = currentRuntime.workspaceName
    ? workspaces.find((candidate) => candidate.name === currentRuntime.workspaceName)
    : undefined

  if (!workspace) {
    return false
  }

  store.set(workspaceRowsAtom, workspaces.map(mapWorkspaceSummaryToRow))
  store.set(selectedProjectIdAtom, project.id)
  store.set(currentSectionAtom, 'workspaces')

  store.set(selectedBrowseRowIdAtom, workspace.id)

  if (currentRuntime.scope === 'workspace') {
    return true
  }

  await openModules(services, store, project.id, workspace.id, {
    implicitWorkspace: workspace.isDefault && !project.hasWorkspaces,
    workspaceSummaries: workspaces,
  })

  const moduleRows = store.get(moduleRowsAtom)
  const moduleRow = moduleRows.find((row) => row.label === currentRuntime.moduleName)

  if (moduleRow) {
    store.set(selectedBrowseRowIdAtom, moduleRow.id)
    return true
  }

  return false
}
