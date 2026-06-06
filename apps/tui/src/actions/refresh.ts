import { sync } from '@harbour/reconciler'
import { Effect, Either } from 'effect'

import type { TuiServices, TuiStore } from '../app-context'
import { listActiveRuntimeSummaries, listProjectSummaries, loadCurrentRuntime, loadUiContext } from '../data'
import { formatError } from '../helpers/errors'
import { projectsScope } from '../store'
import { mapActiveRuntimeSummaryToRow, mapProjectSummaryToRow } from '../transforms'
import { restoreCurrentRuntime, restoreUiContext } from './restore'

export async function loadProjects(services: TuiServices, store: TuiStore) {
  store.getState().setLoading(true)
  store.getState().clearNotice()

  try {
    const syncResult = await Effect.runPromise(Effect.either(sync(services.options)))

    if (Either.isLeft(syncResult)) {
      store.setState((state) => ({
        browse: { ...state.browse, list: { ...state.browse.list, selectedId: null } },
        data: { ...state.data, projectRows: [] },
      }))
      store.getState().setNotice(formatError(syncResult.left))
      return
    }

    const [summaries, activeRuntimeSummaries, currentRuntime, savedContext] = await Promise.all([
      listProjectSummaries(services.options.dbPath),
      listActiveRuntimeSummaries(services.options.dbPath),
      loadCurrentRuntime(),
      loadUiContext(services.options.dbPath),
    ])

    store.setState((state) => ({
      active: {
        ...state.active,
        list: {
          ...state.active.list,
          selectedId:
            getActiveRuntimeRowId(activeRuntimeSummaries, currentRuntime) ?? activeRuntimeSummaries[0]?.id ?? null,
        },
      },
      app: { ...state.app, currentRuntime },
      browse: {
        ...state.browse,
        list: { ...state.browse.list, selectedId: summaries[0]?.id ?? null },
        scope: projectsScope(),
      },
      data: {
        ...state.data,
        activeRuntimeRows: activeRuntimeSummaries.map(mapActiveRuntimeSummaryToRow),
        moduleRows: [],
        projectRows: summaries.map(mapProjectSummaryToRow),
        workspaceRows: [],
      },
    }))

    const restoredFromTmux = await restoreCurrentRuntime(services, store, currentRuntime, summaries)

    if (!restoredFromTmux) {
      await restoreUiContext(services, store, savedContext, summaries)
    }

    store.getState().setNotice(summaries.length === 0 ? 'No projects yet. Check config or run sync.' : null)
  } catch (error) {
    store.setState((state) => ({
      active: { ...state.active, list: { ...state.active.list, selectedId: null } },
      app: { ...state.app, currentRuntime: null },
      browse: { ...state.browse, list: { ...state.browse.list, selectedId: null } },
      data: { ...state.data, activeRuntimeRows: [], projectRows: [] },
    }))
    store.getState().setNotice(formatError(error))
  } finally {
    store.getState().setLoading(false)
  }
}

function getActiveRuntimeRowId(
  rows: Awaited<ReturnType<typeof listActiveRuntimeSummaries>>,
  currentRuntime: Awaited<ReturnType<typeof loadCurrentRuntime>>,
) {
  if (!currentRuntime) {
    return null
  }

  return (
    rows.find((row) => row.sessionName === currentRuntime.sessionName)?.id ??
    rows.find((row) =>
      row.scope === currentRuntime.scope &&
      row.projectName === currentRuntime.projectName &&
      row.workspaceName === (currentRuntime.workspaceName ?? null) &&
      row.moduleName === (currentRuntime.moduleName ?? null),
    )?.id ??
    null
  )
}
