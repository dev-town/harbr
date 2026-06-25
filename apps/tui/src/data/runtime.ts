import { Effect, Either } from 'effect'
import { RuntimeTmuxService } from '@harbr/runtime-tmux'

import type { TuiServices } from '../app-context'

export async function loadCurrentRuntime(services: TuiServices) {
  return services.effectRuntime
    .runPromise(
      Effect.either(
        Effect.gen(function* () {
          const runtimeTmux = yield* RuntimeTmuxService

          return yield* runtimeTmux.getCurrentRuntime
        }),
      ),
    )
    .then((result) => (Either.isRight(result) ? result.right : null))
}
