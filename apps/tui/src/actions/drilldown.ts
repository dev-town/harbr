import type { TuiServices, TuiStore } from '../app-context'
import { listModuleSummaries, listWorkspaceSummaries } from '../data'
import type { VisibilityFilter } from '../types/navigation'
import { formatError } from '../helpers/errors'
import { browseVisibilityAtom, currentSectionAtom, moduleRowsAtom, noticeAtom, selectedBrowseRowIdAtom, selectedProjectIdAtom, selectedWorkspaceIdAtom, selectedWorkspaceImplicitAtom, workspaceRowsAtom } from '../state'
import { mapModuleSummaryToRow, mapWorkspaceSummaryToRow } from '../transforms'
import { clearNotice, resetQuery, resetSelection, setLoading } from './store'

export async function openWorkspaces(
  services: TuiServices,
  store: TuiStore,
  projectId: string,
  openOptions?: {
    selectedWorkspaceName?: string
    visibility?: VisibilityFilter
  },
) {
  setLoading(store, true)
  clearNotice(store)

  try {
    const summaries = await listWorkspaceSummaries(projectId, services.options.dbPath)
    store.set(moduleRowsAtom, [])
    store.set(workspaceRowsAtom, summaries.map(mapWorkspaceSummaryToRow))
    store.set(selectedProjectIdAtom, projectId)
    store.set(selectedWorkspaceIdAtom, null)
    store.set(selectedWorkspaceImplicitAtom, false)
    store.set(browseVisibilityAtom, openOptions?.visibility ?? 'active')
    store.set(currentSectionAtom, 'workspaces')
    resetSelection(store)

    if (openOptions?.selectedWorkspaceName) {
      const selectedWorkspace = summaries.find(
        (workspace) => workspace.name === openOptions.selectedWorkspaceName,
      )

      if (selectedWorkspace) {
        store.set(selectedBrowseRowIdAtom, selectedWorkspace.id)
      }
    }

    resetQuery(store)
  } catch (error) {
    store.set(noticeAtom, formatError(error))
  } finally {
    setLoading(store, false)
  }
}

export async function openModules(
  services: TuiServices,
  store: TuiStore,
  projectId: string,
  workspaceId: string,
  openOptions?: {
    implicitWorkspace?: boolean
    workspaceSummaries?: Awaited<ReturnType<typeof listWorkspaceSummaries>>
  },
) {
  setLoading(store, true)
  clearNotice(store)

  try {
    const [workspaceSummaries, moduleSummaries] = await Promise.all([
      openOptions?.workspaceSummaries
        ? Promise.resolve(openOptions.workspaceSummaries)
        : listWorkspaceSummaries(projectId, services.options.dbPath),
      listModuleSummaries(workspaceId, services.options.dbPath),
    ])

    store.set(workspaceRowsAtom, workspaceSummaries.map(mapWorkspaceSummaryToRow))
    store.set(moduleRowsAtom, moduleSummaries.map(mapModuleSummaryToRow))
    store.set(selectedProjectIdAtom, projectId)
    store.set(selectedWorkspaceIdAtom, workspaceId)
    store.set(selectedWorkspaceImplicitAtom, openOptions?.implicitWorkspace === true)
    store.set(currentSectionAtom, 'modules')
    resetSelection(store)
    resetQuery(store)
  } catch (error) {
    store.set(noticeAtom, formatError(error))
  } finally {
    setLoading(store, false)
  }
}

export async function openDefaultWorkspaceModules(services: TuiServices, store: TuiStore, projectId: string) {
  setLoading(store, true)
  clearNotice(store)

  try {
    const summaries = await listWorkspaceSummaries(projectId, services.options.dbPath)
    const defaultWorkspace = summaries.find((workspace) => workspace.isDefault)

    if (!defaultWorkspace) {
      // TODO: surface a clearer empty-state when project module config exists but no default workspace was persisted.
      store.set(noticeAtom, 'No default workspace found')
      return
    }

    await openModules(services, store, projectId, defaultWorkspace.id, {
      implicitWorkspace: true,
      workspaceSummaries: summaries,
    })
  } catch (error) {
    store.set(noticeAtom, formatError(error))
  } finally {
    setLoading(store, false)
  }
}
