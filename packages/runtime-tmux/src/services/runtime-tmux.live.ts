import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { Effect, Layer } from 'effect'

import { parseSessionName } from '../session-name.util'
import { TmuxCommandError, TmuxNotFoundError } from '../runtime-tmux.errors'
import type { CurrentRuntime, RuntimeDiscovery } from '../runtime-tmux.types'
import {
  RuntimeTmuxService,
  type RuntimeTmuxServiceApi,
} from './runtime-tmux.service'

const execFileAsync = promisify(execFile)

export const RuntimeTmuxServiceLive = Layer.succeed(RuntimeTmuxService, {
  getCurrentRuntime: getCurrentRuntimeLive(),
  listRuntimes: listRuntimesLive(),
} satisfies RuntimeTmuxServiceApi)

export function makeRuntimeTmuxServiceLayer() {
  return RuntimeTmuxServiceLive
}

export function listRuntimes() {
  return Effect.flatMap(RuntimeTmuxService, (service) => service.listRuntimes).pipe(
    Effect.provide(makeRuntimeTmuxServiceLayer()),
  )
}

export function getCurrentRuntime() {
  return Effect.flatMap(RuntimeTmuxService, (service) => service.getCurrentRuntime).pipe(
    Effect.provide(makeRuntimeTmuxServiceLayer()),
  )
}

function getCurrentRuntimeLive() {
  return Effect.tryPromise({
    try: async () => {
      const { stdout } = await execFileAsync('tmux', ['display-message', '-p', '#{session_name}'])
      return parseSessionName(stdout.trim()) satisfies CurrentRuntime
    },
    catch: (error) => mapTmuxError(error),
  }).pipe(
    Effect.catchTag('TmuxNotFoundError', () => Effect.succeed<CurrentRuntime>(null)),
    Effect.catchTag('TmuxCommandError', (error) =>
      isNoServerRunning(error.message)
        ? Effect.succeed<CurrentRuntime>(null)
        : Effect.fail(error),
    ),
  )
}

function listRuntimesLive() {
  return Effect.tryPromise({
    try: async () => {
      const { stdout } = await execFileAsync('tmux', [
        'list-sessions',
        '-F',
        '#{session_name}',
      ])

      return {
        runtimes: stdout
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .map(parseSessionName)
          .filter((runtime): runtime is NonNullable<typeof runtime> => runtime !== null),
        runtimeIssue: null,
      } satisfies RuntimeDiscovery
    },
    catch: (error) => mapTmuxError(error),
  }).pipe(
    Effect.catchTag('TmuxNotFoundError', () =>
      Effect.succeed<RuntimeDiscovery>({
        runtimes: [],
        runtimeIssue: 'tmux_not_found',
      }),
    ),
    Effect.catchTag('TmuxCommandError', (error) =>
      isNoServerRunning(error.message)
        ? Effect.succeed<RuntimeDiscovery>({
            runtimes: [],
            runtimeIssue: null,
          })
        : Effect.fail(error),
    ),
  )
}

function mapTmuxError(error: unknown) {
  if (isExecError(error) && error.code === 'ENOENT') {
    return new TmuxNotFoundError()
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : String(error)

  return new TmuxCommandError({ message })
}

function isNoServerRunning(message: string) {
  return message.includes('no server running')
}

function isExecError(
  error: unknown,
): error is Error & { code?: number | string | undefined } {
  return error instanceof Error
}
