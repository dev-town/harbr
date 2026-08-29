import { Effect, Either } from 'effect'
import { RuntimeService } from '@harbr/runtime'

import type { TuiServices } from '~/app-context'

export async function loadCurrentRuntime(services: TuiServices) {
  return services.effectRuntime
    .runPromise(
      Effect.either(
        Effect.gen(function* () {
          const runtime = yield* RuntimeService

          return yield* runtime.getCurrentRuntime
        }),
      ),
    )
    .then((result) => (Either.isRight(result) ? result.right : null))
}
