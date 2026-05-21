import type { HarbourContext, ProjectSummary } from '@harbour/domain'

import type { TuiAppContext } from '../app-context'
import { listWorkspaceSummaries, loadCurrentRuntime } from '../data'
import { clampIndex } from '../helpers/selection'
import { currentSectionAtom, moduleRowsAtom, selectedIndexAtom, selectedProjectIdAtom, workspaceRowsAtom } from '../state'
import { mapWorkspaceSummaryToRow } from '../transforms'
import { openDefaultWorkspaceModules, openModules, openWorkspaces } from './drilldown'

export async function restoreUiContext(
  context: TuiAppContext,
  savedContext: HarbourContext,
  projects: readonly ProjectSummary[],
) {
  const project = savedContext.projectId
    ? projects.find((candidate) => candidate.id === savedContext.projectId)
    : undefined

  if (!project) {
    return
  }

  const projectIndex = projects.findIndex((candidate) => candidate.id === project.id)
  context.store.set(selectedIndexAtom, clampIndex(projectIndex, projects.length))

  if (savedContext.workspaceId && project.hasModules) {
    // TODO: prefer workspaces view instead when sticky context points at a project that no longer has module config.
    await openModules(context, project.id, savedContext.workspaceId)

    if (savedContext.moduleId) {
      const moduleRows = context.store.get(moduleRowsAtom)
      const moduleIndex = moduleRows.findIndex((row) => row.moduleId === savedContext.moduleId)

      if (moduleIndex >= 0) {
        context.store.set(selectedIndexAtom, moduleIndex)
      }
    }

    return
  }

  if (project.hasWorkspaces) {
    await openWorkspaces(context, project.id)

    if (savedContext.workspaceId) {
      const workspaceRows = context.store.get(workspaceRowsAtom)
      const workspaceIndex = workspaceRows.findIndex((row) => row.workspaceId === savedContext.workspaceId)

      if (workspaceIndex >= 0) {
        context.store.set(selectedIndexAtom, workspaceIndex)
      }
    }

    return
  }

  if (project.hasModules) {
    await openDefaultWorkspaceModules(context, project.id)
  }
}

export async function restoreCurrentRuntime(
  context: TuiAppContext,
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

  const projectIndex = projects.findIndex((candidate) => candidate.id === project.id)
  context.store.set(selectedIndexAtom, clampIndex(projectIndex, projects.length))

  if (currentRuntime.scope === 'project') {
    return true
  }

  const workspaces = await listWorkspaceSummaries(project.id, context.options.dbPath)
  const workspace = currentRuntime.workspaceName
    ? workspaces.find((candidate) => candidate.name === currentRuntime.workspaceName)
    : undefined

  if (!workspace) {
    return false
  }

  context.store.set(workspaceRowsAtom, workspaces.map(mapWorkspaceSummaryToRow))
  context.store.set(selectedProjectIdAtom, project.id)
  context.store.set(currentSectionAtom, 'workspaces')

  const workspaceIndex = workspaces.findIndex((candidate) => candidate.id === workspace.id)
  context.store.set(selectedIndexAtom, clampIndex(workspaceIndex, workspaces.length))

  if (currentRuntime.scope === 'workspace') {
    return true
  }

  await openModules(context, project.id, workspace.id, {
    implicitWorkspace: workspace.isDefault && !project.hasWorkspaces,
    workspaceSummaries: workspaces,
  })

  const moduleRows = context.store.get(moduleRowsAtom)
  const moduleIndex = moduleRows.findIndex((row) => row.label === currentRuntime.moduleName)

  if (moduleIndex >= 0) {
    context.store.set(selectedIndexAtom, moduleIndex)
    return true
  }

  return false
}
