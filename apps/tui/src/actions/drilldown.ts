import type { TuiServices, TuiStore } from '../app-context'
import { listModuleSummaries, listWorkspaceSummaries } from '../data'
import type { VisibilityFilter } from '../types/navigation'
import { formatError } from '../helpers/errors'
import { modulesScope, workspacesScope } from '../store'
import { mapModuleSummaryToRow, mapWorkspaceSummaryToRow } from '../transforms'

export async function openWorkspaces(
  services: TuiServices,
  store: TuiStore,
  projectId: string,
  openOptions?: {
    selectedWorkspaceName?: string
    visibility?: VisibilityFilter
  },
) {
  store.getState().setLoading(true)
  store.getState().clearNotice()

  try {
    const summaries = await listWorkspaceSummaries(services, projectId)
    store.setState((state) => ({
      browse: {
        ...state.browse,
        scope: workspacesScope(projectId),
        visibility: openOptions?.visibility ?? state.browse.visibility,
      },
      data: {
        ...state.data,
        moduleRows: [],
        workspaceRows: summaries.map(mapWorkspaceSummaryToRow),
      },
    }))
    store.getState().resetBrowseSelection()

    if (openOptions?.selectedWorkspaceName) {
      const selectedWorkspace = summaries.find(
        (workspace) => workspace.name === openOptions.selectedWorkspaceName,
      )

      if (selectedWorkspace) {
        store.setState((state) => ({
          browse: {
            ...state.browse,
            list: { ...state.browse.list, selectedId: selectedWorkspace.id },
          },
        }))
      }
    }

    store.getState().resetBrowseQuery()
  } catch (error) {
    store.getState().setNotice(formatError(error), 'error')
  } finally {
    store.getState().setLoading(false)
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
  store.getState().setLoading(true)
  store.getState().clearNotice()

  try {
    const [workspaceSummaries, moduleSummaries] = await Promise.all([
      openOptions?.workspaceSummaries
        ? Promise.resolve(openOptions.workspaceSummaries)
        : listWorkspaceSummaries(services, projectId),
      listModuleSummaries(services, workspaceId),
    ])

    store.setState((state) => ({
      browse: {
        ...state.browse,
        scope: modulesScope(
          projectId,
          workspaceId,
          openOptions?.implicitWorkspace === true
            ? 'implicit-default'
            : 'explicit',
        ),
      },
      data: {
        ...state.data,
        moduleRows: moduleSummaries.map(mapModuleSummaryToRow),
        workspaceRows: workspaceSummaries.map(mapWorkspaceSummaryToRow),
      },
    }))
    store.getState().resetBrowseSelection()
    store.getState().resetBrowseQuery()
  } catch (error) {
    store.getState().setNotice(formatError(error), 'error')
  } finally {
    store.getState().setLoading(false)
  }
}

export async function openDefaultWorkspaceModules(
  services: TuiServices,
  store: TuiStore,
  projectId: string,
) {
  store.getState().setLoading(true)
  store.getState().clearNotice()

  try {
    const summaries = await listWorkspaceSummaries(services, projectId)
    const defaultWorkspace = summaries.find((workspace) => workspace.isDefault)

    if (!defaultWorkspace) {
      // TODO: surface a clearer empty-state when project module config exists but no default workspace was persisted.
      store.getState().setNotice('No default workspace found', 'warning')
      return
    }

    await openModules(services, store, projectId, defaultWorkspace.id, {
      implicitWorkspace: true,
      workspaceSummaries: summaries,
    })
  } catch (error) {
    store.getState().setNotice(formatError(error), 'error')
  } finally {
    store.getState().setLoading(false)
  }
}
