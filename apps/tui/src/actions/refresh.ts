import { ConfigService } from '@harbr/config'
import { ReconcilerService } from '@harbr/reconciler'
import { Effect, Either } from 'effect'

import type { TuiServices, TuiStore } from '~/app-context'
import {
  listActiveRuntimeSummaries,
  listConfiguredProjectWindows,
  listProjectSummaries,
  loadCurrentRuntime,
  loadUiContext,
} from '~/data'
import { formatError } from '~/helpers/errors'
import { projectsScope } from '~/store'
import {
  mapActiveRuntimeSummaryToRow,
  mapProjectSummaryToRow,
} from '~/transforms'
import { restoreCurrentRuntime, restoreUiContext } from './restore'

export async function loadProjects(services: TuiServices, store: TuiStore) {
  store.getState().setLoading(true)
  store.getState().clearNotice()

  try {
    const syncResult = await services.effectRuntime.runPromise(
      Effect.either(
        Effect.gen(function* () {
          const configService = yield* ConfigService
          const config = yield* configService.load
          const reconciler = yield* ReconcilerService

          return yield* reconciler.syncProjects(config.projects)
        }),
      ),
    )

    if (Either.isLeft(syncResult)) {
      store.setState((state) => ({
        browse: {
          ...state.browse,
          list: { ...state.browse.list, selectedId: null },
        },
        data: { ...state.data, projectRows: [] },
      }))
      store.getState().setNotice(formatError(syncResult.left), 'error')
      return
    }

    const [
      summaries,
      activeRuntimeSummaries,
      currentRuntime,
      savedContext,
      configuredWindows,
    ] = await Promise.all([
      listProjectSummaries(services),
      listActiveRuntimeSummaries(services),
      loadCurrentRuntime(services),
      loadUiContext(services),
      listConfiguredProjectWindows(services),
    ])
    const projectWindows = summaries.map((summary) => ({
      projectId: summary.id,
      projectName: summary.name,
      windows:
        configuredWindows.find((entry) => entry.projectName === summary.name)
          ?.windows ?? [],
    }))

    store.setState((state) => ({
      active: {
        ...state.active,
        list: {
          ...state.active.list,
          selectedId:
            getActiveRuntimeRowId(activeRuntimeSummaries, currentRuntime) ??
            activeRuntimeSummaries[0]?.id ??
            null,
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
        activeRuntimeRows: activeRuntimeSummaries.map(
          mapActiveRuntimeSummaryToRow,
        ),
        moduleRows: [],
        projectWindows,
        projectRows: summaries.map(mapProjectSummaryToRow),
        workspaceRows: [],
      },
    }))

    const restoredFromTmux = await restoreCurrentRuntime(
      services,
      store,
      currentRuntime,
      summaries,
    )

    if (!restoredFromTmux) {
      await restoreUiContext(services, store, savedContext, summaries)
    }

    store
      .getState()
      .setNotice(
        summaries.length === 0
          ? 'No projects yet. Check config or run sync.'
          : null,
        'info',
      )
  } catch (error) {
    store.setState((state) => ({
      active: {
        ...state.active,
        list: { ...state.active.list, selectedId: null },
      },
      app: { ...state.app, currentRuntime: null },
      browse: {
        ...state.browse,
        list: { ...state.browse.list, selectedId: null },
      },
      data: {
        ...state.data,
        activeRuntimeRows: [],
        projectRows: [],
        projectWindows: [],
      },
    }))
    store.getState().setNotice(formatError(error), 'error')
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
    rows.find(
      (row) =>
        row.scope === currentRuntime.scope &&
        row.projectName === currentRuntime.projectName &&
        row.workspaceName === (currentRuntime.workspaceName ?? null) &&
        row.moduleName === (currentRuntime.moduleName ?? null),
    )?.id ??
    null
  )
}
