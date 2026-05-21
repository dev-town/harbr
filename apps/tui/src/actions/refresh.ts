import { sync } from '@harbour/reconciler'
import { Effect, Either } from 'effect'

import type { TuiAppContext } from '../app-context'
import { listProjectSummaries, loadCurrentRuntime, loadUiContext } from '../data'
import { formatError } from '../helpers/errors'
import { currentSectionAtom, moduleRowsAtom, noticeAtom, projectRowsAtom, selectedIndexAtom, selectedProjectIdAtom, selectedWorkspaceIdAtom, selectedWorkspaceImplicitAtom, workspaceRowsAtom } from '../state'
import { mapProjectSummaryToRow } from '../transforms'
import { restoreCurrentRuntime, restoreUiContext } from './restore'
import { clearNotice, setLoading } from './state'

export async function loadProjects(context: TuiAppContext) {
  setLoading(context, true)
  clearNotice(context)

  const syncResult = await Effect.runPromise(Effect.either(sync(context.options)))

  if (Either.isLeft(syncResult)) {
    context.store.set(projectRowsAtom, [])
    context.store.set(noticeAtom, formatError(syncResult.left))
    setLoading(context, false)
    return
  }

  const summaries = await listProjectSummaries(context.options.dbPath)
  const currentRuntime = await loadCurrentRuntime()
  const savedContext = await loadUiContext(context.options.dbPath)
  context.store.set(projectRowsAtom, summaries.map(mapProjectSummaryToRow))
  context.store.set(moduleRowsAtom, [])
  context.store.set(workspaceRowsAtom, [])
  context.store.set(currentSectionAtom, 'projects')
  context.store.set(selectedProjectIdAtom, null)
  context.store.set(selectedWorkspaceIdAtom, null)
  context.store.set(selectedWorkspaceImplicitAtom, false)
  context.store.set(selectedIndexAtom, 0)
  setLoading(context, false)

  const restoredFromTmux = await restoreCurrentRuntime(context, currentRuntime, summaries)

  if (!restoredFromTmux) {
    await restoreUiContext(context, savedContext, summaries)
  }

  context.store.set(
    noticeAtom,
    summaries.length === 0 ? 'No projects yet. Check config or run sync.' : null,
  )
}
