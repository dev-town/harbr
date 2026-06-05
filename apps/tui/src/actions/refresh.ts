import { sync } from '@harbour/reconciler'
import { Effect, Either } from 'effect'

import type { TuiServices, TuiStore } from '../app-context'
import { listActiveRuntimeSummaries, listProjectSummaries, loadCurrentRuntime, loadUiContext } from '../data'
import { formatError } from '../helpers/errors'
import { selectedActiveRowIdAtom } from '../routes/active'
import {
  browseSectionAtom,
  selectedBrowseRowIdAtom,
  selectedProjectIdAtom,
  selectedWorkspaceIdAtom,
  selectedWorkspaceImplicitAtom,
} from '../routes/browse'
import {
  activeRuntimeRowsAtom,
  currentRuntimeAtom,
  moduleRowsAtom,
  noticeAtom,
  projectRowsAtom,
  workspaceRowsAtom,
} from '../state'
import { mapActiveRuntimeSummaryToRow, mapProjectSummaryToRow } from '../transforms'
import { restoreCurrentRuntime, restoreUiContext } from './restore'
import { clearNotice, setLoading } from './store'

export async function loadProjects(services: TuiServices, store: TuiStore) {
  setLoading(store, true)
  clearNotice(store)

  try {
    const syncResult = await Effect.runPromise(Effect.either(sync(services.options)))

    if (Either.isLeft(syncResult)) {
      store.set(projectRowsAtom, [])
      store.set(selectedBrowseRowIdAtom, null)
      store.set(noticeAtom, formatError(syncResult.left))
      return
    }

    const [summaries, activeRuntimeSummaries, currentRuntime, savedContext] = await Promise.all([
      listProjectSummaries(services.options.dbPath),
      listActiveRuntimeSummaries(services.options.dbPath),
      loadCurrentRuntime(),
      loadUiContext(services.options.dbPath),
    ])

    store.set(projectRowsAtom, summaries.map(mapProjectSummaryToRow))
    store.set(activeRuntimeRowsAtom, activeRuntimeSummaries.map(mapActiveRuntimeSummaryToRow))
    store.set(currentRuntimeAtom, currentRuntime)
    store.set(moduleRowsAtom, [])
    store.set(workspaceRowsAtom, [])
    store.set(browseSectionAtom, 'projects')
    store.set(selectedProjectIdAtom, null)
    store.set(selectedWorkspaceIdAtom, null)
    store.set(selectedWorkspaceImplicitAtom, false)
    store.set(
      selectedActiveRowIdAtom,
      getActiveRuntimeRowId(activeRuntimeSummaries, currentRuntime) ?? activeRuntimeSummaries[0]?.id ?? null,
    )
    store.set(selectedBrowseRowIdAtom, summaries[0]?.id ?? null)

    const restoredFromTmux = await restoreCurrentRuntime(services, store, currentRuntime, summaries)

    if (!restoredFromTmux) {
      await restoreUiContext(services, store, savedContext, summaries)
    }

    store.set(
      noticeAtom,
      summaries.length === 0 ? 'No projects yet. Check config or run sync.' : null,
    )
  } catch (error) {
    store.set(activeRuntimeRowsAtom, [])
    store.set(currentRuntimeAtom, null)
    store.set(projectRowsAtom, [])
    store.set(selectedActiveRowIdAtom, null)
    store.set(selectedBrowseRowIdAtom, null)
    store.set(noticeAtom, formatError(error))
  } finally {
    setLoading(store, false)
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
