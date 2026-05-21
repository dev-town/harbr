import type { TuiAppContext } from '../app-context'
import { listModuleSummaries, listWorkspaceSummaries } from '../data'
import { formatError } from '../helpers/errors'
import { currentSectionAtom, moduleRowsAtom, noticeAtom, selectedProjectIdAtom, selectedWorkspaceIdAtom, selectedWorkspaceImplicitAtom, workspaceRowsAtom } from '../state'
import { mapModuleSummaryToRow, mapWorkspaceSummaryToRow } from '../transforms'
import { clearNotice, resetQuery, resetSelection, setLoading } from './state'

export async function openWorkspaces(context: TuiAppContext, projectId: string) {
  setLoading(context, true)
  clearNotice(context)

  try {
    const summaries = await listWorkspaceSummaries(projectId, context.options.dbPath)
    context.store.set(moduleRowsAtom, [])
    context.store.set(workspaceRowsAtom, summaries.map(mapWorkspaceSummaryToRow))
    context.store.set(selectedProjectIdAtom, projectId)
    context.store.set(selectedWorkspaceIdAtom, null)
    context.store.set(selectedWorkspaceImplicitAtom, false)
    context.store.set(currentSectionAtom, 'workspaces')
    resetSelection(context)
    resetQuery(context)
  } catch (error) {
    context.store.set(noticeAtom, formatError(error))
  } finally {
    setLoading(context, false)
  }
}

export async function openModules(
  context: TuiAppContext,
  projectId: string,
  workspaceId: string,
  openOptions?: {
    implicitWorkspace?: boolean
    workspaceSummaries?: Awaited<ReturnType<typeof listWorkspaceSummaries>>
  },
) {
  setLoading(context, true)
  clearNotice(context)

  try {
    const [workspaceSummaries, moduleSummaries] = await Promise.all([
      openOptions?.workspaceSummaries
        ? Promise.resolve(openOptions.workspaceSummaries)
        : listWorkspaceSummaries(projectId, context.options.dbPath),
      listModuleSummaries(workspaceId, context.options.dbPath),
    ])

    context.store.set(workspaceRowsAtom, workspaceSummaries.map(mapWorkspaceSummaryToRow))
    context.store.set(moduleRowsAtom, moduleSummaries.map(mapModuleSummaryToRow))
    context.store.set(selectedProjectIdAtom, projectId)
    context.store.set(selectedWorkspaceIdAtom, workspaceId)
    context.store.set(selectedWorkspaceImplicitAtom, openOptions?.implicitWorkspace === true)
    context.store.set(currentSectionAtom, 'modules')
    resetSelection(context)
    resetQuery(context)
  } catch (error) {
    context.store.set(noticeAtom, formatError(error))
  } finally {
    setLoading(context, false)
  }
}

export async function openDefaultWorkspaceModules(context: TuiAppContext, projectId: string) {
  const summaries = await listWorkspaceSummaries(projectId, context.options.dbPath)
  const defaultWorkspace = summaries.find((workspace) => workspace.isDefault)

  if (!defaultWorkspace) {
    // TODO: surface a clearer empty-state when project module config exists but no default workspace was persisted.
    context.store.set(noticeAtom, 'No default workspace found')
    return
  }

  await openModules(context, projectId, defaultWorkspace.id, {
    implicitWorkspace: true,
    workspaceSummaries: summaries,
  })
}
