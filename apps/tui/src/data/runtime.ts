import { getCurrentRuntime } from '@harbr/runtime-tmux'
import { Effect, Either } from 'effect'

export async function loadCurrentRuntime() {
  return Effect.runPromise(Effect.either(getCurrentRuntime())).then((result) =>
    Either.isRight(result) ? result.right : null,
  )
}
