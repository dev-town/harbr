import type { ResolvedContextTarget, WindowConfig } from '@harbr/domain'
import { RuntimeService } from '@harbr/runtime'
import { Effect } from 'effect'

import type { TuiServices, TuiStore } from '~/app-context'
import { formatError } from '~/helpers/errors'
import { persistContext } from './runtime'

export async function createWindowsForContext(
  services: TuiServices,
  store: TuiStore,
  target: ResolvedContextTarget,
  windows: readonly WindowConfig[],
) {
  store.getState().setLoading(true)
  store.getState().clearNotice()

  try {
    await persistContext(services, target.context)
    const result = await services.effectRuntime.runPromise(
      Effect.gen(function* () {
        const runtime = yield* RuntimeService

        return yield* runtime.createRuntimeWindows({
          target: target.runtimeTarget,
          windows,
        })
      }),
    )

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
