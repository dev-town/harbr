import type { ResolvedContextTarget, WindowConfig } from '@harbr/domain'
import { RuntimeService } from '@harbr/runtime'
import { Effect } from 'effect'

import type { TuiServices, TuiStore } from '~/app-context'
import { formatError } from '~/helpers/errors'
import { persistContext } from './runtime'
import { loadProjects } from './refresh'

export async function createWindowsForContext(
  services: TuiServices,
  store: TuiStore,
  target: ResolvedContextTarget,
  windows: readonly WindowConfig[],
  hooks: CreateWindowsHooks = defaultCreateWindowsHooks,
) {
  store.getState().setLoading(true)
  store.getState().clearNotice()

  try {
    let result

    try {
      result = await services.effectRuntime.runPromise(
        Effect.gen(function* () {
          const runtime = yield* RuntimeService

          return yield* runtime.createRuntimeWindows({
            target: target.runtimeTarget,
            windows,
          })
        }),
      )
    } catch (error) {
      await refreshAfterFailure(services, store, hooks)
      throw error
    }

    await hooks.persistContext(services, target.context)
    await hooks.refresh(services, store)

    if (result.createdWindowNames.length === 0) {
      store.getState().setNotice('Windows already exist', 'warning')
      return
    }

    store.getState().closeActionsMenu()
    await services.shutdown()
  } catch (error) {
    store.getState().setNotice(formatError(error), 'error')
  } finally {
    store.getState().setLoading(false)
  }
}

type CreateWindowsHooks = {
  persistContext: typeof persistContext
  refresh: typeof loadProjects
}

const defaultCreateWindowsHooks: CreateWindowsHooks = {
  persistContext,
  refresh: loadProjects,
}

async function refreshAfterFailure(
  services: TuiServices,
  store: TuiStore,
  hooks: CreateWindowsHooks,
) {
  try {
    await hooks.refresh(services, store)
  } catch {
    // Preserve the provider error that caused layout application to fail.
  }
}
