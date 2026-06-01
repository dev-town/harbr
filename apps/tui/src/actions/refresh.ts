import { sync } from '@harbour/reconciler'
import { Effect, Either } from 'effect'

import type { TuiServices, TuiStore } from '../app-context'
import { listProjectSummaries, loadCurrentRuntime, loadUiContext } from '../data'
import { formatError } from '../helpers/errors'
import { currentSectionAtom, moduleRowsAtom, noticeAtom, projectRowsAtom, selectedBrowseRowIdAtom, selectedProjectIdAtom, selectedWorkspaceIdAtom, selectedWorkspaceImplicitAtom, workspaceRowsAtom } from '../state'
import { mapProjectSummaryToRow } from '../transforms'
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

    const [summaries, currentRuntime, savedContext] = await Promise.all([
      listProjectSummaries(services.options.dbPath),
      loadCurrentRuntime(),
      loadUiContext(services.options.dbPath),
    ])

    store.set(projectRowsAtom, summaries.map(mapProjectSummaryToRow))
    store.set(moduleRowsAtom, [])
    store.set(workspaceRowsAtom, [])
    store.set(currentSectionAtom, 'projects')
    store.set(selectedProjectIdAtom, null)
    store.set(selectedWorkspaceIdAtom, null)
    store.set(selectedWorkspaceImplicitAtom, false)
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
    store.set(projectRowsAtom, [])
    store.set(selectedBrowseRowIdAtom, null)
    store.set(noticeAtom, formatError(error))
  } finally {
    setLoading(store, false)
  }
}
