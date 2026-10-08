import { Effect, Result } from 'effect'
import { RuntimeService } from '@harbr/runtime'

import type { TuiServices } from '~/app-context'

export async function loadCurrentRuntime(services: TuiServices) {
  return services.effectRuntime
    .runPromise(
      Effect.result(
        Effect.gen(function* () {
          const runtime = yield* RuntimeService

          return yield* runtime.getCurrentRuntime
        }),
      ),
    )
    .then((result) => (Result.isSuccess(result) ? result.success : null))
}
