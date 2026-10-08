import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { Context, Effect, Layer } from 'effect'

const execFileAsync = promisify(execFile)

export class HerdrUnavailable extends Error {
  readonly _tag = 'HerdrUnavailable'

  constructor(
    message: string,
    readonly providerMissing: boolean,
  ) {
    super(message)
  }
}

export type HerdrClientApi = {
  readonly execute: (
    args: readonly string[],
  ) => Effect.Effect<string, HerdrUnavailable>
}

export class HerdrClient extends Context.Service<HerdrClient, HerdrClientApi>()(
  '@harbr/runtime-herdr/HerdrClient',
) {}

export const HerdrClientLive = Layer.succeed(HerdrClient, {
  execute: (args) =>
    Effect.tryPromise({
      try: async () => {
        const { stdout } = await execFileAsync(
          process.env.HERDR_BIN_PATH || 'herdr',
          [...args],
        )

        return stdout
      },
      catch: (error) =>
        new HerdrUnavailable(
          formatCommandError(error),
          isExecError(error) && error.code === 'ENOENT',
        ),
    }),
} satisfies HerdrClientApi)

function formatCommandError(error: unknown) {
  if (isExecError(error) && typeof error.stderr === 'string') {
    const stderr = error.stderr.trim()

    if (stderr) {
      return stderr
    }
  }

  return error instanceof Error ? error.message : String(error)
}

function isExecError(
  error: unknown,
): error is Error & { code?: number | string | undefined; stderr?: unknown } {
  return error instanceof Error
}
